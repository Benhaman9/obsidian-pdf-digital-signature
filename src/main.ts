import {
  Modal,
  Notice,
  Plugin,
  Setting,
  FileSystemAdapter,
} from "obsidian";
import * as obsidian from "obsidian";
import * as path from "path";
import * as fs from "fs";
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
import { t } from "./i18n";

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
        this.settings.firmarPdf = !this.settings.firmarPdf;
        await this.saveSettings();
        new Notice(
          this.settings.firmarPdf
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
    this.checkCertificateExpirationAlert();
  }

  onunload(): void {
    // Limpieza al descargar el plugin
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
    if (path.isAbsolute(relOrAbsPath)) {
      return relOrAbsPath;
    }
    return path.join(this.getVaultBasePath(), relOrAbsPath);
  }

  checkCertificateExpirationAlert(): void {
    const certPath = this.resolveAbsolutePath(this.settings.certPath);
    const info = getCertificateInfo(certPath, this.settings.certPassword);

    if (!info.exists || !info.valid) return;

    if (info.isExpired) {
      new Notice(
        t("notice_cert_expired", {
          date: info.notAfter?.toLocaleDateString() || "N/A",
        }),
        15000
      );
    } else if (info.isExpiringSoon) {
      new Notice(
        t("notice_cert_expiring_soon", {
          days: info.daysRemaining || 0,
          date: info.notAfter?.toLocaleDateString() || "N/A",
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
      this.settings.certPassword,
      "Personal / Universidad",
      "CL",
      3
    );

    await fs.promises.writeFile(certPath, p12Buffer);
    return certPath;
  }

  hookPdfModal(): void {
    const originalModalOpen = Modal.prototype.open;

    Modal.prototype.open = ((plugin: PdfDigitalSignaturePlugin) => {
      return function (this: Modal) {
        const res = originalModalOpen.call(this);
        try {
          plugin.inspectAndEnhanceModal(this);
        } catch {
          // Ignorar errores de inspección
        }
        return res;
      };
    })(this);

    this.register(() => {
      Modal.prototype.open = originalModalOpen;
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

    this.checkCertificateExpirationAlert();

    const settingContainer = targetModal.contentEl.createDiv({
      cls: "firma-pdf-modal-toggle-container",
    });
    applyStyles(settingContainer, {
      marginTop: "14px",
      paddingTop: "10px",
      borderTop: "1px solid var(--background-modifier-border)",
    });

    new Setting(settingContainer)
      .setName(t("modal_toggle_title"))
      .setDesc(t("modal_toggle_desc"))
      .addToggle((toggle) => {
        toggle.setValue(this.settings.firmarPdf);
        toggle.onChange(async (val) => {
          this.settings.firmarPdf = val;
          await this.saveSettings();
        });
      });

    const originalPrintToPdf = targetModal.printToPdf;

    targetModal.printToPdf = async (options: Record<string, unknown>) => {
      const shouldSign = this.settings.firmarPdf;

      if (shouldSign && options) {
        options.displayHeaderFooter = true;
        options.headerTemplate = "<div></div>";

        const pageNumHtml = this.settings.mostrarNumeroPagina
          ? `<span style="font-size: 8pt; color: #777;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>`
          : "";

        options.footerTemplate = `
          <div style="font-size: 8.5pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; color: #333; -webkit-print-color-adjust: exact;">
            <span style="font-weight: 600; letter-spacing: 0.1px;">${this.settings.nombreFirmante}</span>
            ${pageNumHtml}
          </div>
        `;

        if (options.marginsType === 1 || options.marginsType === 2) {
          options.marginsType = 0;
          if (options.margins) delete options.margins;
        }

        if (this.settings.openAfterSigning) {
          options.open = false;
        }
      }

      const result = await originalPrintToPdf.call(targetModal, options);

      if (shouldSign && options && typeof options.filepath === "string") {
        this.scheduleSigning(options.filepath);
      }

      return result;
    };
  }

  scheduleSigning(filepath: string): void {
    const delaySec = Math.max(1, parseInt(String(this.settings.delaySeconds), 10) || 5);
    const delayMs = delaySec * 1000;
    const baseName = path.basename(filepath);

    new Notice(
      t("notice_saved_countdown", { name: baseName, delay: delaySec }),
      delayMs
    );

    window.setTimeout(() => {
      void (async () => {
        const signingNotice = new Notice(
          t("notice_signing_in_progress", { name: baseName }),
          0
        );

        try {
          await this.executeDigitalSignature(filepath);
          signingNotice.hide();

          new Notice(
            t("notice_signing_success", { name: baseName }),
            6000
          );

          if (this.settings.openAfterSigning) {
            const electron = getElectron();
            if (electron?.shell) {
              await electron.shell.openPath(filepath);
            }
          }
        } catch (err) {
          signingNotice.hide();
          const msg = err instanceof Error ? err.message : String(err);
          new Notice(
            t("notice_signing_error", { name: baseName, error: msg }),
            12000
          );
        }
      })();
    }, delayMs);
  }

  async executeDigitalSignature(filepath: string): Promise<void> {
    const certPath = this.resolveAbsolutePath(this.settings.certPath);

    if (!fs.existsSync(certPath)) {
      await this.generateCertificate();
    }

    await signPdfFile(filepath, certPath, this.settings.certPassword, {
      signerName: this.settings.nombreFirmante,
      reason: this.settings.motivo,
      location: this.settings.ubicacion,
    });
  }

  promptSignExistingPdf(): void {
    try {
      const electron = getElectron();
      const dialog = electron?.remote ? electron.remote.dialog : null;
      if (!dialog) {
        new Notice("No access to system file dialog.");
        return;
      }
      void dialog
        .showOpenDialog({
          title: t("cmd_sign_existing"),
          filters: [{ name: "PDF Files", extensions: ["pdf"] }],
          properties: ["openFile"],
        })
        .then((res) => {
          if (!res.canceled && res.filePaths.length > 0) {
            const pdfFile = res.filePaths[0];
            this.scheduleSigning(pdfFile);
          }
        });
    } catch {
      new Notice("Error opening file dialog.");
    }
  }
}