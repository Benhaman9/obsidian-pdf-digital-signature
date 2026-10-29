import {
  Modal,
  Notice,
  Plugin,
  Setting,
  FileSystemAdapter,
  SuggestModal,
  TFile,
} from "obsidian";
import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import {
  DEFAULT_SETTINGS,
  PdfSignatureSettings,
  PdfSignatureSettingTab,
  renderSigningPolicySettings,
} from "./settings";
import {
  createSelfSignedCertificate,
  getCertificateInfo,
  signPdfFile,
  signPdfCopy,
} from "./signer";
import { t, getLanguage } from "./i18n";
import { normalizeSignatureMode, normalizeJurisdiction } from "./signing-policy";
import { ObsidianExportAdapter } from "./obsidian-export-adapter";
import { waitForExport } from "./export-readiness";
import { defaultCertificatePath, certificateLocation } from "./certificate-location";
import { completeExportFingerprint, fileFingerprint } from "./file-snapshot";
import { inspectPdfSignature } from "./verifier";

interface ElectronModule {
  shell?: { openPath: (path: string) => Promise<string> };
  remote?: { dialog: { showOpenDialog: (opts: unknown) => Promise<{ canceled: boolean; filePaths: string[] }> } };
}

function getElectron(): ElectronModule | null {
  try {
    const win = window as unknown as { require?: (mod: string) => ElectronModule };
    return win.require ? win.require("electron") : null;
  } catch {
    return null;
  }
}

export default class PdfDigitalSignaturePlugin extends Plugin {
  settings: PdfSignatureSettings = { ...DEFAULT_SETTINGS };
  private pendingSigning = new Set<string>();
  private stopped = false;
  private signingControllers = new Map<string, AbortController>();

  async onload(): Promise<void> {
    this.stopped = false;
    await this.loadSettings();

    // 1. Enganchar la ventana nativa de "Exportar a PDF"
    this.hookPdfModal();

    // 2. Registrar pestaÃ±a de configuraciÃ³n
    this.addSettingTab(new PdfSignatureSettingTab(this.app, this));

    // 3. AÃ±adir comando para alternar activaciÃ³n de firma por defecto
    this.addCommand({
      id: "toggle-pdf-signature-default",
      name: t("cmd_toggle_default"),
      callback: async () => {
        this.settings.firmarCriptograficamente = !this.settings.firmarCriptograficamente;
        await this.saveSettings();
        new Notice(
          this.settings.firmarCriptograficamente
            ? t("notice_signature_toggled_on")
            : t("notice_signature_toggled_off")
        );
      },
    });

    // 4. AÃ±adir comando para firmar un PDF existente
    this.addCommand({
      id: "sign-existing-pdf-file",
      name: t("cmd_sign_existing"),
      callback: () => {
        this.promptSignExistingPdf();
      },
    });

    this.addCommand({
      id: "verify-existing-pdf-file", name: t("verify_command"),
      callback: () => { void this.promptVerifyExistingPdf(); },
    });

    for (const verify of [false, true]) {
      this.addCommand({
        id: verify ? "verify-active-pdf" : "sign-active-pdf",
        name: t(verify ? "verify_command" : "cmd_sign_existing") + " (PDF)",
        checkCallback: (checking: boolean) => {
          const file = this.app.workspace.getActiveFile();
          if (!file || file.extension.toLowerCase() !== "pdf") return false;
          if (!checking) {
            const filepath = this.resolveAbsolutePath(file.path);
            if (verify) void this.verifyPdf(filepath); else void this.reviewSignExistingPdf(filepath);
          }
          return true;
        },
      });
    }
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof TFile) || file.extension.toLowerCase() !== "pdf") return;
      menu.addItem(item => item.setTitle(t("cmd_sign_existing")).setIcon("signature").onClick(() => {
        void this.reviewSignExistingPdf(this.resolveAbsolutePath(file.path));
      }));
      menu.addItem(item => item.setTitle(t("verify_command")).setIcon("shield-check").onClick(() => {
        void this.verifyPdf(this.resolveAbsolutePath(file.path));
      }));
    }));

    // 5. Verificar estado de caducidad del certificado al iniciar Obsidian
    if (this.settings.firmarCriptograficamente) {
      this.checkCertificateExpirationAlert();
    }
  }

  onunload(): void {
    this.stopped = true;
    for (const controller of this.signingControllers.values()) controller.abort();
    this.signingControllers.clear();
    this.pendingSigning.clear();
  }

  async loadSettings(): Promise<void> {
    const savedSettings = ((await this.loadData()) || {}) as Partial<PdfSignatureSettings>;
    const secretId = "obsidian-pdf-digital-signature-certificate-password";
    const storedPassword = this.app.secretStorage.getSecret(secretId);
    const password = storedPassword ?? savedSettings.certPassword ?? randomUUID();
    if (storedPassword === null) this.app.secretStorage.setSecret(secretId, password);
    this.settings = Object.assign({}, DEFAULT_SETTINGS, {
      nombreFirmante: t("default_signer_name"), motivo: t("default_reason"), ubicacion: t("default_location"),
    }, savedSettings, { certPassword: password });

    const newInstallation = Object.keys(savedSettings).length === 0;
    this.settings.signatureMode = savedSettings.signatureMode === "approval" || savedSettings.signatureMode === "certify"
      ? savedSettings.signatureMode : newInstallation ? "approval" : "certify";
    this.settings.signatureModeChosen = typeof savedSettings.signatureModeChosen === "boolean"
      ? savedSettings.signatureModeChosen : !newInstallation;
    if (typeof savedSettings.certPath !== "string") {
      try { this.settings.certPath = defaultCertificatePath(this.getVaultBasePath()); }
      catch { this.settings.certPath = ""; }
    }
    this.settings.jurisdiction = normalizeJurisdiction(savedSettings.jurisdiction);

    if (!Object.prototype.hasOwnProperty.call(savedSettings, "firmarCriptograficamente")) {
      const legacyEnabled = Boolean(savedSettings.firmarPdf ?? DEFAULT_SETTINGS.firmarPdf);
      this.settings.firmarCriptograficamente = legacyEnabled;
      this.settings.mostrarNombreFirmante = legacyEnabled;
      this.settings.mostrarNumeroPagina =
        legacyEnabled && Boolean(savedSettings.mostrarNumeroPagina ?? DEFAULT_SETTINGS.mostrarNumeroPagina);
    }
    if (!Object.prototype.hasOwnProperty.call(savedSettings, "firmarCriptograficamente") ||
        Object.prototype.hasOwnProperty.call(savedSettings, "certPassword")) await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    const { certPassword: _password, ...persistedSettings } = this.settings;
    await this.saveData(persistedSettings);
  }

  async setCertificatePassword(password: string): Promise<void> {
    this.app.secretStorage.setSecret("obsidian-pdf-digital-signature-certificate-password", password);
    this.settings.certPassword = password;
    await this.saveSettings();
  }

  getVaultBasePath(): string {
    const adapter = this.app.vault?.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return (adapter as unknown as { basePath?: string } | undefined)?.basePath || "";
  }

  resolveAbsolutePath(relOrAbsPath: string): string {
    if (!relOrAbsPath.trim()) throw new Error(t("error_empty_cert_path"));
    if (path.isAbsolute(relOrAbsPath)) {
      return relOrAbsPath;
    }
    return path.join(this.getVaultBasePath(), relOrAbsPath);
  }

  checkCertificateExpirationAlert(): void {
    if (!this.settings.certPath.trim()) return;
    const certPath = this.resolveAbsolutePath(this.settings.certPath);
    const info = getCertificateInfo(certPath, this.settings.certPassword);

    if (!info.exists || (!info.valid && !info.isExpired)) return;

    if (info.isExpired) {
      new Notice(
        t("notice_cert_expired", {
          date: info.notAfter?.toLocaleDateString(getLanguage()) || "N/A",
        }),
        15000
      );
    } else if (info.isExpiringSoon) {
      new Notice(
        t("notice_cert_expiring_soon", {
          days: info.daysRemaining || 0,
          date: info.notAfter?.toLocaleDateString(getLanguage()) || "N/A",
        }),
        12000
      );
    }
  }

  async generateCertificate(): Promise<string> {
    let certPath = this.resolveAbsolutePath(this.settings.certPath);
    if (fs.existsSync(certPath)) {
      const ext = path.extname(certPath);
      certPath = certPath.slice(0, certPath.length - ext.length) + `.self-signed-${randomUUID().slice(0, 8)}.pfx`;
    }
    const p12Buffer = createSelfSignedCertificate(this.settings.nombreFirmante, this.settings.certPassword);
    await fs.promises.mkdir(path.dirname(certPath), { recursive: true });
    // Exclusive creation: never replace a provider's certificate or private key.
    await fs.promises.writeFile(certPath, p12Buffer, { flag: "wx", mode: 0o600 });
    if (this.settings.certPath !== certPath) {
      this.settings.certPath = certPath;
      await this.saveSettings();
    }
    return certPath;
  }

  private exportAdapter = new ObsidianExportAdapter(this);
  hookPdfModal(): void { this.exportAdapter.install(); }
  inspectAndEnhanceModal(modal: unknown): void { this.exportAdapter.enhance(modal); }

  async scheduleSigning(filepath: string, settings = this.settings, preserveOriginal = false): Promise<void> {
    if (this.stopped) return;
    const jobPath = path.resolve(filepath);
    if (this.pendingSigning.has(jobPath)) {
      this.signingControllers.get(jobPath)?.abort();
      new Notice(t("notice_pending_changed"));
      return;
    }
    const controller = new AbortController();
    this.pendingSigning.add(jobPath);
    this.signingControllers.set(jobPath, controller);
    const jobSettings = { ...settings };
    const baseName = path.basename(filepath);
    const status = new Notice(t("export_waiting", { name: baseName }), 0);
    const update = (text: string) => { status.setMessage?.(text); };
    try {
      // A complete existing revision is pinned immediately. Incomplete new exports
      // can finish writing, but a second job for the same destination cancels this one.
      let expectedFingerprint: string | undefined;
      try { expectedFingerprint = preserveOriginal ? fileFingerprint(filepath) : completeExportFingerprint(filepath); }
      catch (error) { if (!["ENOENT", "EBUSY", "EPERM"].includes((error as NodeJS.ErrnoException).code || "")) throw error; }
      const timeout = Math.max(5, Math.min(60, Number(jobSettings.exportTimeoutSeconds) || 15));
      const fingerprint = await waitForExport(filepath, {
        expectedFingerprint, timeoutMs: timeout * 1000, signal: controller.signal,
        onPhase: (phase) => update(t(phase === "validating" ? "export_validating" : "export_waiting", { name: baseName })),
      });
      if (this.stopped || controller.signal.aborted) return;
      if (fileFingerprint(filepath) !== fingerprint) throw Object.assign(new Error(t("notice_pending_changed")), { code: "EXPORT_CHANGED" });
      update(t("notice_signing_in_progress", { name: baseName }));
      const signedPath = await this.executeDigitalSignature(filepath, jobSettings, preserveOriginal,
        () => update(t("phase_verifying", { name: baseName })), fingerprint) || filepath;
      if (this.stopped) return;
      new Notice(t("notice_signing_success", { name: path.basename(signedPath) }), 6000);
      if (jobSettings.openAfterSigning) {
        const shell = getElectron()?.shell;
        if (shell) {
          try {
            const error = await shell.openPath(signedPath);
            if (error) new Notice(t("notice_open_error", { error }));
          } catch (error) {
            new Notice(t("notice_open_error", { error: error instanceof Error ? error.message : String(error) }));
          }
        }
      }
    } catch (error) {
      if (!this.stopped) {
        const code = (error as NodeJS.ErrnoException).code;
        const message = code === "EXPORT_TIMEOUT" ? t("export_timeout")
          : code === "EXPORT_INVALID" ? t("export_invalid")
          : code === "EXPORT_ABORTED" ? t("export_cancelled")
          : code === "EXPORT_CHANGED" ? t("notice_pending_changed")
          : code === "EXPORT_TOO_LARGE" ? t("error_file_too_large")
          : error instanceof Error ? error.message : String(error);
        new Notice(t("notice_signing_error", { name: baseName, error: message }), 12000);
      }
    } finally {
      status.hide();
      this.pendingSigning.delete(jobPath);
      this.signingControllers.delete(jobPath);
    }
  }

  async executeDigitalSignature(filepath: string, settings = this.settings, preserveOriginal = false, onVerifying?: () => void, expectedFingerprint?: string): Promise<string> {
    const certPath = this.resolveAbsolutePath(settings.certPath);

    const metadata = {
      onVerifying, expectedFingerprint,
      signatureMode: normalizeSignatureMode(settings.signatureMode),
      signerName: settings.nombreFirmante,
      reason: settings.motivo,
      location: settings.ubicacion,
    };
    if (preserveOriginal) return signPdfCopy(filepath, certPath, settings.certPassword, metadata);
    try {
      await signPdfFile(filepath, certPath, settings.certPassword, metadata);
      return filepath;
    } catch (error) {
      const failure = error as NodeJS.ErrnoException;
      // Windows readers/indexers can hold the freshly exported destination open.
      // A signed sibling is safe; replacing bytes in-place would not be atomic.
      if (failure.syscall !== "rename" || !["EPERM", "EBUSY", "EACCES"].includes(failure.code || "")) throw error;
      return signPdfCopy(filepath, certPath, settings.certPassword, metadata);
    }
  }

  async verifyPdf(filepath: string): Promise<void> {
    try {
      const file = await fs.promises.open(filepath, "r");
      let bytes: Buffer;
      try {
        if ((await file.stat()).size > 64 * 1024 * 1024) throw new Error(t("verify_unsupported"));
        bytes = await file.readFile();
      } finally { await file.close(); }
      const result = inspectPdfSignature(bytes);
      const modal = new Modal(this.app);
      modal.titleEl.setText(t("verify_title"));
      modal.contentEl.style.overflowWrap = "anywhere";
      modal.contentEl.createEl("p", { text: path.basename(filepath) });
      modal.contentEl.createEl("p", { text: t(result.signedRevisionIntegrity === "valid" ? "verify_revision_valid"
        : result.signedRevisionIntegrity === "invalid" ? "verify_revision_invalid" : "verify_revision_unknown") });
      modal.contentEl.createEl("p", { text: t(result.currentFileCoverage === "entire-file" ? "verify_coverage_full"
        : result.currentFileCoverage === "signed-revision-only" ? "verify_coverage_partial" : "verify_coverage_unknown") });
      if (result.status === "unsupported" || result.status === "unsigned") modal.contentEl.createEl("p", { text: t(`verify_${result.status}`) });
      modal.contentEl.createEl("p", { text: t("verify_trust_not_checked") });
      modal.contentEl.createEl("p", { text: t("verify_revocation_not_checked") });
      modal.contentEl.createEl("p", { text: t("verify_timestamp_not_checked") });
      if (result.appendedBytes) modal.contentEl.createEl("p", { text: t("verify_appended", { bytes: result.appendedBytes }) });
      if (result.certificateIssuer) modal.contentEl.createEl("p", { text: t("verify_issuer", { issuer: result.certificateIssuer }) });
      if (result.certificateFingerprint) modal.contentEl.createEl("p", { text: t("verify_fingerprint", { fingerprint: result.certificateFingerprint }) });
      if (result.selfSigned) modal.contentEl.createEl("p", { text: t("verify_self_signed") });
      if (result.signer) modal.contentEl.createEl("p", { text: t("verify_signer", { name: result.signer }) });
      if (result.certificateValidNow !== undefined) modal.contentEl.createEl("p", {
        text: t(result.certificateValidNow ? "verify_certificate_current" : "verify_certificate_expired"),
      });
      modal.contentEl.createEl("p", { text: t("verify_limits"), cls: "setting-item-description" });
      modal.open();
    } catch (error) {
      new Notice(t("verify_error", { error: error instanceof Error ? error.message : String(error) }));
    }
  }

  async promptVerifyExistingPdf(): Promise<void> {
    try {
      const dialog = getElectron()?.remote?.dialog;
      if (!dialog) { new ExistingPdfModal(this, true).open(); return; }
      const result = await dialog.showOpenDialog({ title: t("verify_command"),
        filters: [{ name: t("dialog_pdf_files"), extensions: ["pdf"] }], properties: ["openFile"] });
      if (!result.canceled && result.filePaths.length) await this.verifyPdf(result.filePaths[0]);
    } catch (error) {
      new Notice(t("verify_error", { error: error instanceof Error ? error.message : String(error) }));
    }
  }

  async reviewSignExistingPdf(filepath: string): Promise<void> {
    const modal = new Modal(this.app);
    modal.titleEl.setText(t("signing_review_title"));
    modal.contentEl.createEl("p", { text: t("signing_review_file", { name: path.basename(filepath) }) });
    const certPath = this.settings.certPath.trim() ? this.resolveAbsolutePath(this.settings.certPath) : "";
    const info = getCertificateInfo(certPath, this.settings.certPassword);
    modal.contentEl.createEl("p", { text: t("signing_review_certificate", { name: info.commonName || t("settings_cert_status_not_found") }) });
    if (!info.valid) modal.contentEl.createEl("p", { text: info.error || t("error_invalid_cert") });
    renderSigningPolicySettings(modal.contentEl, this, true);
    const location = certPath ? certificateLocation(this.getVaultBasePath(), certPath) : "unknown";
    if (location !== "outside") modal.contentEl.createEl("p", { text: t(location === "inside" ? "cert_location_inside" : "cert_location_unknown") });
    modal.contentEl.createEl("p", { text: t("signing_review_copy") });
    new Setting(modal.contentEl)
      .addButton(button => button.setButtonText(t("action_cancel")).onClick(() => modal.close()))
      .addButton(button => button.setButtonText(t("signing_review_action")).setCta().setDisabled(!info.valid).onClick(() => {
        if (this.settings.signatureModeChosen === false) { new Notice(t("signature_choice_required")); return; }
        button.setDisabled(true);
        modal.close();
        this.scheduleSigning(filepath, { ...this.settings }, true);
      }));
    modal.open();
  }

  async promptSignExistingPdf(): Promise<void> {
    try {
      const electron = getElectron();
      const dialog = electron?.remote ? electron.remote.dialog : null;
      if (!dialog) {
        new ExistingPdfModal(this).open();
        return;
      }
      const res = await dialog.showOpenDialog({
        title: t("cmd_sign_existing"),
        filters: [{ name: t("dialog_pdf_files"), extensions: ["pdf"] }],
        properties: ["openFile"],
      });
      if (!res.canceled && res.filePaths.length > 0) {
        await this.reviewSignExistingPdf(res.filePaths[0]);
      }
    } catch (error) {
      new Notice(t("notice_dialog_error", { error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

class ExistingPdfModal extends SuggestModal<TFile> {
  constructor(private plugin: PdfDigitalSignaturePlugin, private verify = false) {
    super(plugin.app);
    this.setPlaceholder(t(verify ? "verify_command" : "cmd_sign_existing"));
  }

  getSuggestions(query: string): TFile[] {
    return this.plugin.app.vault.getFiles().filter((file) =>
      file.extension.toLowerCase() === "pdf" && file.path.toLowerCase().includes(query.toLowerCase()));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  onChooseSuggestion(file: TFile): void {
    const filepath = this.plugin.resolveAbsolutePath(file.path);
    if (this.verify) void this.plugin.verifyPdf(filepath);
    else void this.plugin.reviewSignExistingPdf(filepath);
  }
}
