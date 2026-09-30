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
} from "./settings";
import {
  createSelfSignedCertificate,
  getCertificateInfo,
  signPdfFile,
} from "./signer";
import { t, getLanguage } from "./i18n";

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
  settings: PdfSignatureSettings = DEFAULT_SETTINGS;
  private pendingSigning = new Set<string>();

  async onload(): Promise<void> {
    await this.loadSettings();

    // 1. Enganchar la ventana nativa de "Exportar a PDF"
    this.hookPdfModal();

    // 2. Registrar pestaña de configuración
    this.addSettingTab(new PdfSignatureSettingTab(this.app, this));

    // 3. Añadir comando para alternar activación de firma por defecto
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

    // 4. Añadir comando para firmar un PDF existente
    this.addCommand({
      id: "sign-existing-pdf-file",
      name: t("cmd_sign_existing"),
      callback: () => {
        this.promptSignExistingPdf();
      },
    });

    // 5. Verificar estado de caducidad del certificado al iniciar Obsidian
    if (this.settings.firmarCriptograficamente) {
      this.checkCertificateExpirationAlert();
    }
  }

  onunload(): void {
    // Limpieza al descargar el plugin
  }

  async loadSettings(): Promise<void> {
    const savedSettings = ((await this.loadData()) || {}) as Partial<PdfSignatureSettings>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, {
      nombreFirmante: t("default_signer_name"), motivo: t("default_reason"), ubicacion: t("default_location"),
      certPassword: randomUUID(),
    }, savedSettings);

    if (!Object.prototype.hasOwnProperty.call(savedSettings, "firmarCriptograficamente")) {
      const legacyEnabled = Boolean(savedSettings.firmarPdf ?? DEFAULT_SETTINGS.firmarPdf);
      this.settings.firmarCriptograficamente = legacyEnabled;
      this.settings.mostrarNombreFirmante = legacyEnabled;
      this.settings.mostrarNumeroPagina =
        legacyEnabled && Boolean(savedSettings.mostrarNumeroPagina ?? DEFAULT_SETTINGS.mostrarNumeroPagina);
    }
    if (!Object.prototype.hasOwnProperty.call(savedSettings, "firmarCriptograficamente") ||
        !Object.prototype.hasOwnProperty.call(savedSettings, "certPassword")) await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
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
    const certPath = this.resolveAbsolutePath(this.settings.certPath);
    const certDir = path.dirname(certPath);

    if (!fs.existsSync(certDir)) {
      await fs.promises.mkdir(certDir, { recursive: true });
    }

    const p12Buffer = createSelfSignedCertificate(
      this.settings.nombreFirmante,
      this.settings.certPassword
    );

    // Preserve the previous private key when renewing a certificate.
    if (fs.existsSync(certPath)) {
      await fs.promises.copyFile(certPath, `${certPath}.${randomUUID()}.bak`, fs.constants.COPYFILE_EXCL);
    }
    const tempPath = `${certPath}.${randomUUID()}.tmp`;
    try {
      await fs.promises.writeFile(tempPath, p12Buffer, { flag: "wx", mode: 0o600 });
      await fs.promises.rename(tempPath, certPath);
    } finally {
      await fs.promises.rm(tempPath, { force: true });
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
          // Ignorar errores de inspección
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

      const result = await originalPrintToPdf.call(targetModal, options);

      if (shouldSignCryptographically && options && typeof options.filepath === "string") {
        this.scheduleSigning(options.filepath, exportSettings);
      }

      return result;
    };
    this.register(() => {
      targetModal.printToPdf = originalPrintToPdf;
      targetModal._firmaPdfEnhanced = false;
      settingContainer.remove();
    });
  }

  scheduleSigning(filepath: string, settings = this.settings): void {
    const jobPath = path.resolve(filepath);
    if (this.pendingSigning.has(jobPath)) {
      new Notice(t("notice_already_pending"));
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
      void (async () => {
        const signingNotice = new Notice(
          t("notice_signing_in_progress", { name: baseName }),
          0
        );

        try {
          await this.executeDigitalSignature(filepath, jobSettings);
          signingNotice.hide();

          new Notice(
            t("notice_signing_success", { name: baseName }),
            6000
          );

          if (jobSettings.openAfterSigning) {
            const electron = getElectron();
            if (electron?.shell) {
              try {
                const error = await electron.shell.openPath(filepath);
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

  async executeDigitalSignature(filepath: string, settings = this.settings): Promise<void> {
    const certPath = this.resolveAbsolutePath(settings.certPath);

    if (!fs.existsSync(certPath)) {
      const buffer = createSelfSignedCertificate(settings.nombreFirmante, settings.certPassword);
      await fs.promises.mkdir(path.dirname(certPath), { recursive: true });
      try {
        await fs.promises.writeFile(certPath, buffer, { flag: "wx", mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }

    await signPdfFile(filepath, certPath, settings.certPassword, {
      signerName: settings.nombreFirmante,
      reason: settings.motivo,
      location: settings.ubicacion,
    });
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
        this.scheduleSigning(res.filePaths[0]);
      }
    } catch (error) {
      new Notice(t("notice_dialog_error", { error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

class ExistingPdfModal extends SuggestModal<TFile> {
  constructor(private plugin: PdfDigitalSignaturePlugin) {
    super(plugin.app);
    this.setPlaceholder(t("cmd_sign_existing"));
  }

  getSuggestions(query: string): TFile[] {
    return this.plugin.app.vault.getFiles().filter((file) =>
      file.extension.toLowerCase() === "pdf" && file.path.toLowerCase().includes(query.toLowerCase()));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path);
  }

  onChooseSuggestion(file: TFile): void {
    this.plugin.scheduleSigning(this.plugin.resolveAbsolutePath(file.path));
  }
}
