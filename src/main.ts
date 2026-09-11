import {
  Modal,
  Notice,
  Plugin,
  Setting,
  FileSystemAdapter,
  setCssStyles,
} from "obsidian";
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

    console.log(t("plugin_loaded"));
  }

  onunload(): void {
    console.log("PDF Digital Signature Plugin unloaded.");
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
    return (adapter as any).basePath || "";
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
      // Avisar si quedan 30 días o menos
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
    const self = this;
    const originalModalOpen = Modal.prototype.open;

    Modal.prototype.open = function (this: any) {
      const res = originalModalOpen.apply(this, arguments);
      try {
        self.inspectAndEnhanceModal(this);
      } catch (err) {
        console.error("Error al inspeccionar modal para firma PDF:", err);
      }
      return res;
    };

    this.register(() => {
      Modal.prototype.open = originalModalOpen;
    });
  }

  inspectAndEnhanceModal(modal: any): void {
    if (
      !modal ||
      !modal.file ||
      !modal.modalEl ||
      !modal.modalEl.classList.contains("mod-narrow") ||
      typeof modal.printToPdf !== "function"
    ) {
      return;
    }

    if (modal._firmaPdfEnhanced) return;
    modal._firmaPdfEnhanced = true;

    const self = this;

    // Si el certificado está por caducar o caducó, recordar al usuario también al exportar
    this.checkCertificateExpirationAlert();

    // 1. Insertar el control visual en el modal
    const settingContainer = modal.contentEl.createDiv({
      cls: "firma-pdf-modal-toggle-container",
    });
    setCssStyles(settingContainer, {
      marginTop: "14px",
      paddingTop: "10px",
      borderTop: "1px solid var(--background-modifier-border)",
    });

    new Setting(settingContainer)
      .setName(t("modal_toggle_title"))
      .setDesc(t("modal_toggle_desc"))
      .addToggle((toggle) => {
        toggle.setValue(self.settings.firmarPdf);
        toggle.onChange(async (val) => {
          self.settings.firmarPdf = val;
          await self.saveSettings();
        });
      });

    // 2. Interceptar el método printToPdf del modal
    const originalPrintToPdf = modal.printToPdf;

    modal.printToPdf = async function (options: any) {
      const shouldSign = self.settings.firmarPdf;

      if (shouldSign && options) {
        options.displayHeaderFooter = true;
        options.headerTemplate = "<div></div>";

        const pageNumHtml = self.settings.mostrarNumeroPagina
          ? `<span style="font-size: 8pt; color: #777;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>`
          : "";

        options.footerTemplate = `
          <div style="font-size: 8.5pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; color: #333; -webkit-print-color-adjust: exact;">
            <span style="font-weight: 600; letter-spacing: 0.1px;">${self.settings.nombreFirmante}</span>
            ${pageNumHtml}
          </div>
        `;

        if (options.marginsType === 1 || options.marginsType === 2) {
          options.marginsType = 0;
          if (options.margins) delete options.margins;
        }

        if (self.settings.openAfterSigning) {
          options.open = false;
        }
      }

      const result = await originalPrintToPdf.call(this, options);

      if (shouldSign && options && options.filepath) {
        self.scheduleSigning(options.filepath);
      }

      return result;
    };
  }

  scheduleSigning(filepath: string): void {
    const delaySec = Math.max(1, parseInt(this.settings.delaySeconds as any, 10) || 5);
    const delayMs = delaySec * 1000;
    const baseName = path.basename(filepath);

    new Notice(
      t("notice_saved_countdown", { name: baseName, delay: delaySec }),
      delayMs
    );

    window.setTimeout(async () => {
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
          try {
            const { shell } = require("electron");
            shell.openPath(filepath);
          } catch (openErr) {
            console.warn("No se pudo abrir el visor de PDF:", openErr);
          }
        }
      } catch (err: any) {
        signingNotice.hide();
        console.error("Error al firmar PDF:", err);
        new Notice(
          t("notice_signing_error", { name: baseName, error: err.message || err }),
          12000
        );
      }
    }, delayMs);
  }

  async executeDigitalSignature(filepath: string): Promise<void> {
    let certPath = this.resolveAbsolutePath(this.settings.certPath);

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
      const { remote } = require("electron");
      const dialog = remote ? remote.dialog : null;
      if (!dialog) {
        new Notice("No access to system file dialog.");
        return;
      }
      dialog
        .showOpenDialog({
          title: t("cmd_sign_existing"),
          filters: [{ name: "PDF Files", extensions: ["pdf"] }],
          properties: ["openFile"],
        })
        .then((res: any) => {
          if (!res.canceled && res.filePaths.length > 0) {
            const pdfFile = res.filePaths[0];
            this.scheduleSigning(pdfFile);
          }
        });
    } catch (err) {
      console.error(err);
      new Notice("Error opening file dialog.");
    }
  }
}