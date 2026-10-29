import {
  Modal,
  Notice,
  Plugin,
  Setting,
  FileSystemAdapter,
  SuggestModal,
  TFile,
} from "obsidian";
import * as obsidian from "obsidian";
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
import { fileFingerprint } from "./file-snapshot";
import { inspectPdfSignature } from "./verifier";
import { refreshMathPrintStyles } from "./math-print-styles";

// Helper para setCssStyles seguro contra versiones de tipos antiguas
const applyStyles = (el: HTMLElement, styles: Record<string, string>): void => {
  const setStyles = (obsidian as { setCssStyles?: (e: HTMLElement, s: Record<string, string>) => void }).setCssStyles;
  if (typeof setStyles === "function") {
    setStyles(el, styles);
  } else {
    Object.assign(el.style, styles);
  }
};

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

    this.settings.signatureMode = normalizeSignatureMode(savedSettings.signatureMode);
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
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    return (adapter as unknown as { basePath?: string }).basePath || "";
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

  hookPdfModal(): void {
    const originalModalOpen = Modal.prototype.open;
    let active = true;

    const enhancedOpen = ((plugin: PdfDigitalSignaturePlugin) => {
      return function (this: Modal) {
        const res = originalModalOpen.call(this);
        try {
          if (active) plugin.inspectAndEnhanceModal(this);
        } catch {
          // Ignorar errores de inspecciÃ³n
        }
        return res;
      };
    })(this);
    Modal.prototype.open = enhancedOpen;

    this.register(() => {
      active = false;
      if (Modal.prototype.open === enhancedOpen) Modal.prototype.open = originalModalOpen;
    });
  }

  inspectAndEnhanceModal(modal: unknown): void {
    const targetModal = modal as {
      file?: unknown;
      modalEl?: HTMLElement;
      printToPdf?: (opts: Record<string, unknown>) => Promise<unknown>;
      print?: (container: HTMLElement, component: unknown, includeName: boolean) => Promise<HTMLElement>;
      _firmaPdfEnhanced?: boolean;
      contentEl: HTMLElement;
    };

    if (
      !targetModal ||
      !targetModal.file ||
      !targetModal.modalEl ||
      !targetModal.modalEl.classList.contains("mod-narrow") ||
      typeof targetModal.printToPdf !== "function"
    ) {
      return;
    }

    if (targetModal._firmaPdfEnhanced) return;
    targetModal._firmaPdfEnhanced = true;

    if (this.settings.firmarCriptograficamente) {
      this.checkCertificateExpirationAlert();
    }

    const settingContainer = targetModal.contentEl.createDiv({
      cls: "firma-pdf-modal-toggle-container",
    });
    applyStyles(settingContainer, {
      marginTop: "14px",
      paddingTop: "10px",
      borderTop: "1px solid var(--background-modifier-border)",
    });

    settingContainer.createEl("h3", { text: t("modal_options_title") });

    new Setting(settingContainer)
      .setName(t("modal_crypto_name"))
      .setDesc(t("modal_crypto_desc"))
      .addToggle((toggle) => {
        toggle.setValue(this.settings.firmarCriptograficamente);
        toggle.onChange(async (val) => {
          this.settings.firmarCriptograficamente = val;
          await this.saveSettings();
        });
      });

    renderSigningPolicySettings(settingContainer, this, true);

    new Setting(settingContainer)
      .setName(t("modal_signer_name"))
      .setDesc(t("modal_signer_desc"))
      .addToggle((toggle) => {
        toggle.setValue(this.settings.mostrarNombreFirmante);
        toggle.onChange(async (val) => {
          this.settings.mostrarNombreFirmante = val;
          await this.saveSettings();
        });
      });

    new Setting(settingContainer)
      .setName(t("modal_page_number_name"))
      .setDesc(t("modal_page_number_desc"))
      .addToggle((toggle) => {
        toggle.setValue(this.settings.mostrarNumeroPagina);
        toggle.onChange(async (val) => {
          this.settings.mostrarNumeroPagina = val;
          await this.saveSettings();
        });
      });

    const originalPrintToPdf = targetModal.printToPdf;
    const originalPrint = targetModal.print;
    let renderingFailed = false;
    if (originalPrint) {
      targetModal.print = async (container, component, includeName) => {
        try {
          const rendered = await originalPrint.call(targetModal, container, component, includeName);
          await refreshMathPrintStyles(targetModal.contentEl.ownerDocument, rendered);
          return rendered;
        } catch (error) {
          renderingFailed = true;
          throw error;
        }
      };
    }

    targetModal.printToPdf = async (options: Record<string, unknown>) => {
      const exportSettings = { ...this.settings };
      const shouldSignCryptographically = this.settings.firmarCriptograficamente;
      const shouldAddFooter = this.settings.mostrarNombreFirmante || this.settings.mostrarNumeroPagina;

      if (shouldAddFooter && options) {
        options.displayHeaderFooter = true;
        options.headerTemplate = "<div></div>";

        const pageNumHtml = this.settings.mostrarNumeroPagina
          ? `<span style="margin-left: auto;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>`
          : "";
        const signerNameHtml = this.settings.mostrarNombreFirmante
          ? `<span>${this.settings.nombreFirmante.replace(/[&<>"']/g, (char) => ({
              "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
            }[char]!))}</span>`
          : "";

        options.footerTemplate = `
          <div style="font-size: 7pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; padding: 0 15mm; display: flex; align-items: center; color: #999; -webkit-print-color-adjust: exact;">
            ${signerNameHtml}
            ${pageNumHtml}
          </div>
        `;

        if (options.marginsType === 1 || options.marginsType === 2) {
          options.marginsType = 0;
          if (options.margins) delete options.margins;
        }

      }

      if (shouldSignCryptographically && options && this.settings.openAfterSigning) {
        options.open = false;
      }

      renderingFailed = false;
      const result = await originalPrintToPdf.call(targetModal, options);

      if (!renderingFailed && shouldSignCryptographically && options && typeof options.filepath === "string") {
        this.scheduleSigning(options.filepath, exportSettings);
      }

      return result;
    };
    this.register(() => {
      targetModal.printToPdf = originalPrintToPdf;
      targetModal.print = originalPrint;
      targetModal._firmaPdfEnhanced = false;
      settingContainer.remove();
    });
  }

  scheduleSigning(filepath: string, settings = this.settings, preserveOriginal = false): void {
    if (this.stopped) return;
    const jobPath = path.resolve(filepath);
    if (this.pendingSigning.has(jobPath)) {
      new Notice(t("notice_already_pending"));
      return;
    }
    let fingerprint: string;
    try { fingerprint = fileFingerprint(filepath); }
    catch (error) {
      new Notice(t("notice_signing_error", { name: path.basename(filepath), error: error instanceof Error ? error.message : String(error) }));
      return;
    }
    this.pendingSigning.add(jobPath);
    const jobSettings = { ...settings };
    const delaySec = Math.min(15, Math.max(1, parseInt(String(jobSettings.delaySeconds), 10) || 5));
    const delayMs = delaySec * 1000;
    const baseName = path.basename(filepath);

    new Notice(
      t("notice_saved_countdown", { name: baseName, delay: delaySec }),
      delayMs
    );

    this.registerInterval(window.setTimeout(() => {
      if (this.stopped) { this.pendingSigning.delete(jobPath); return; }
      void (async () => {
        const signingNotice = new Notice(
          t("notice_signing_in_progress", { name: baseName }),
          0
        );

        try {
          if (fileFingerprint(filepath) !== fingerprint) throw new Error(t("notice_pending_changed"));
          const signedPath = await this.executeDigitalSignature(filepath, jobSettings, preserveOriginal) || filepath;
          signingNotice.hide();

          new Notice(
            t("notice_signing_success", { name: path.basename(signedPath) }),
            6000
          );

          if (!this.stopped && jobSettings.openAfterSigning) {
            const electron = getElectron();
            if (electron?.shell) {
              try {
                const error = await electron.shell.openPath(signedPath);
                if (error) new Notice(t("notice_open_error", { error }));
              } catch (error) {
                new Notice(t("notice_open_error", { error: error instanceof Error ? error.message : String(error) }));
              }
            }
          }
        } catch (err) {
          signingNotice.hide();
          const msg = err instanceof Error ? err.message : String(err);
          new Notice(
            t("notice_signing_error", { name: baseName, error: msg }),
            12000
          );
        } finally {
          this.pendingSigning.delete(jobPath);
        }
      })();
    }, delayMs));
  }

  async executeDigitalSignature(filepath: string, settings = this.settings, preserveOriginal = false): Promise<string> {
    const certPath = this.resolveAbsolutePath(settings.certPath);

    const metadata = {
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
      modal.contentEl.createEl("p", { text: t(`verify_${result.status}`) });
      if (result.status === "modified" && result.cryptographicIntegrity !== undefined) modal.contentEl.createEl("p", {
        text: t(result.cryptographicIntegrity ? "verify_crypto_intact" : "verify_crypto_failed"),
      });
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
    modal.contentEl.createEl("p", { text: t("signing_review_copy") });
    new Setting(modal.contentEl)
      .addButton(button => button.setButtonText(t("action_cancel")).onClick(() => modal.close()))
      .addButton(button => button.setButtonText(t("signing_review_action")).setCta().setDisabled(!info.valid).onClick(() => {
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
