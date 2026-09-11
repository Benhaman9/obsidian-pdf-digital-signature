import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import * as obsidian from "obsidian";
import type PdfDigitalSignaturePlugin from "./main";
import { t } from "./i18n";
import { getCertificateInfo } from "./signer";

// Helper para setCssStyles seguro contra versiones antiguas de tipos
const applyStyles = (el: HTMLElement, styles: Record<string, string>): void => {
  const setStyles = (obsidian as { setCssStyles?: (e: HTMLElement, s: Record<string, string>) => void }).setCssStyles;
  if (typeof setStyles === "function") {
    setStyles(el, styles);
  } else {
    Object.assign(el.style, styles);
  }
};

export interface PdfSignatureSettings {
  firmarPdf: boolean;
  nombreFirmante: string;
  mostrarNumeroPagina: boolean;
  delaySeconds: number;
  certPath: string;
  certPassword: string;
  motivo: string;
  ubicacion: string;
  openAfterSigning: boolean;
  lastExpiryAlertTimestamp?: number;
}

export const DEFAULT_SETTINGS: PdfSignatureSettings = {
  firmarPdf: true,
  nombreFirmante: "Benjamín Alcalde G.",
  mostrarNumeroPagina: true,
  delaySeconds: 5,
  certPath: "Scripts/default_certificate.pfx",
  certPassword: "1234",
  motivo: "Personal document",
  ubicacion: "Chile",
  openAfterSigning: true,
};

export class PdfSignatureSettingTab extends PluginSettingTab {
  plugin: PdfDigitalSignaturePlugin;

  constructor(app: App, plugin: PdfDigitalSignaturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // @ts-ignore
  getSettingDefinitions(): unknown[] {
    return [
      {
        id: "firmarPdf",
        name: t("settings_default_toggle_name"),
        description: t("settings_default_toggle_desc"),
        type: "toggle",
      },
      {
        id: "nombreFirmante",
        name: t("settings_signer_name_name"),
        description: t("settings_signer_name_desc"),
        type: "text",
      },
    ];
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName(t("settings_title")).setHeading();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: t("settings_desc"),
    });

    // 1. Activar por defecto
    new Setting(containerEl)
      .setName(t("settings_default_toggle_name"))
      .setDesc(t("settings_default_toggle_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.firmarPdf)
          .onChange(async (val) => {
            this.plugin.settings.firmarPdf = val;
            await this.plugin.saveSettings();
          })
      );

    // 2. Nombre del firmante
    new Setting(containerEl)
      .setName(t("settings_signer_name_name"))
      .setDesc(t("settings_signer_name_desc"))
      .addText((text) =>
        text
          .setPlaceholder("Default")
          .setValue(this.plugin.settings.nombreFirmante)
          .onChange(async (val) => {
            this.plugin.settings.nombreFirmante = val.trim() || "Default";
            await this.plugin.saveSettings();
          })
      );

    // 3. Mostrar número de página
    new Setting(containerEl)
      .setName(t("settings_page_number_name"))
      .setDesc(t("settings_page_number_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.mostrarNumeroPagina)
          .onChange(async (val) => {
            this.plugin.settings.mostrarNumeroPagina = val;
            await this.plugin.saveSettings();
          })
      );

    // 4. Demora antes de firmar
    new Setting(containerEl)
      .setName(t("settings_delay_name"))
      .setDesc(t("settings_delay_desc"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 15, 1)
          .setValue(this.plugin.settings.delaySeconds)
          .onChange(async (val) => {
            this.plugin.settings.delaySeconds = val;
            await this.plugin.saveSettings();
          })
      );

    // 5. Abrir visor tras firmar
    new Setting(containerEl)
      .setName(t("settings_open_after_name"))
      .setDesc(t("settings_open_after_desc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openAfterSigning)
          .onChange(async (val) => {
            this.plugin.settings.openAfterSigning = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName(t("settings_cert_section_title")).setHeading();

    // Estado del certificado con semáforo y días restantes
    this.renderCertificateStatus(containerEl);

    // 6. Ruta del certificado
    new Setting(containerEl)
      .setName(t("settings_cert_path_name"))
      .setDesc(t("settings_cert_path_desc"))
      .addText((text) =>
        text
          .setPlaceholder("Scripts/default_certificate.pfx")
          .setValue(this.plugin.settings.certPath)
          .onChange(async (val) => {
            this.plugin.settings.certPath = val.trim();
            await this.plugin.saveSettings();
            this.display(); // refrescar estado
          })
      );

    // 7. Contraseña del certificado
    new Setting(containerEl)
      .setName(t("settings_cert_password_name"))
      .setDesc(t("settings_cert_password_desc"))
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setValue(this.plugin.settings.certPassword)
          .onChange(async (val) => {
            this.plugin.settings.certPassword = val;
            await this.plugin.saveSettings();
          });
      });

    // 8. Motivo de la firma
    new Setting(containerEl)
      .setName(t("settings_reason_name"))
      .setDesc(t("settings_reason_desc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.motivo)
          .onChange(async (val) => {
            this.plugin.settings.motivo = val;
            await this.plugin.saveSettings();
          })
      );

    // 9. Ubicación
    new Setting(containerEl)
      .setName(t("settings_location_name"))
      .setDesc(t("settings_location_desc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.ubicacion)
          .onChange(async (val) => {
            this.plugin.settings.ubicacion = val;
            await this.plugin.saveSettings();
          })
      );

    // 10. Botones de acción directa en JS puro
    new Setting(containerEl)
      .setName(t("settings_btn_generate"))
      .setDesc(t("settings_btn_generate_desc"))
      .addButton((btn) =>
        btn.setButtonText(t("settings_btn_generate")).setCta().onClick(async () => {
          btn.setDisabled(true);
          try {
            await this.plugin.generateCertificate();
            new Notice(t("notice_cert_generated", { path: this.plugin.settings.certPath }));
            this.display(); // actualizar estado del certificado en pantalla
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            new Notice(t("notice_cert_gen_error", { error: msg }));
          } finally {
            btn.setDisabled(false);
          }
        })
      );
  }

  renderCertificateStatus(containerEl: HTMLElement): void {
    const certPath = this.plugin.resolveAbsolutePath(this.plugin.settings.certPath);
    const info = getCertificateInfo(certPath, this.plugin.settings.certPassword);

    const statusEl = containerEl.createDiv({ cls: "pdf-sig-cert-status" });
    applyStyles(statusEl, {
      padding: "10px 14px",
      marginBottom: "14px",
      borderRadius: "8px",
      fontSize: "var(--font-ui-smaller)",
    });

    if (!info.exists) {
      applyStyles(statusEl, {
        backgroundColor: "var(--background-secondary)",
        border: "1px solid var(--background-modifier-border)",
      });
      statusEl.setText(t("settings_cert_status_not_found"));
    } else if (info.isExpired) {
      applyStyles(statusEl, {
        backgroundColor: "rgba(235, 87, 87, 0.15)",
        border: "1px solid rgba(235, 87, 87, 0.4)",
        color: "var(--text-error)",
      });
      statusEl.setText(
        t("settings_cert_status_expired", {
          date: info.notAfter?.toLocaleDateString() || "N/A",
        })
      );
    } else if (info.isExpiringSoon) {
      applyStyles(statusEl, {
        backgroundColor: "rgba(242, 201, 76, 0.15)",
        border: "1px solid rgba(242, 201, 76, 0.4)",
        color: "var(--text-warning)",
      });
      statusEl.setText(
        t("settings_cert_status_expiring", {
          days: info.daysRemaining || 0,
          date: info.notAfter?.toLocaleDateString() || "N/A",
        })
      );
    } else if (info.valid) {
      applyStyles(statusEl, {
        backgroundColor: "rgba(39, 174, 96, 0.12)",
        border: "1px solid rgba(39, 174, 96, 0.35)",
        color: "var(--text-success)",
      });
      statusEl.setText(
        t("settings_cert_status_valid", {
          days: info.daysRemaining || 0,
          date: info.notAfter?.toLocaleDateString() || "N/A",
        })
      );
    } else {
      applyStyles(statusEl, {
        backgroundColor: "rgba(235, 87, 87, 0.15)",
        border: "1px solid rgba(235, 87, 87, 0.4)",
      });
      statusEl.setText(`⚠️ Error: ${info.error || "Certificado no válido o contraseña incorrecta"}`);
    }
  }
}