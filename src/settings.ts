import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import * as obsidian from "obsidian";
import type PdfDigitalSignaturePlugin from "./main";
import { t, getLanguage, type TranslationKey } from "./i18n";
import { getCertificateInfo } from "./signer";
import { certificateLocation } from "./certificate-location";
import { getJurisdictionGuidance, normalizeJurisdiction, normalizeSignatureMode, type Jurisdiction, type SignatureMode } from "./signing-policy";

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
  /** Legacy combined toggle, retained only to migrate pre-1.0.9 settings. */
  firmarPdf: boolean;
  firmarCriptograficamente: boolean;
  mostrarNombreFirmante: boolean;
  nombreFirmante: string;
  mostrarNumeroPagina: boolean;
  delaySeconds: number;
  exportTimeoutSeconds: number;
  certPath: string;
  certPassword: string;
  motivo: string;
  ubicacion: string;
  openAfterSigning: boolean;
  signatureMode: SignatureMode;
  signatureModeChosen: boolean;
  jurisdiction: Jurisdiction;
  lastExpiryAlertTimestamp?: number;
}

export const DEFAULT_SETTINGS: PdfSignatureSettings = {
  firmarPdf: true,
  firmarCriptograficamente: true,
  mostrarNombreFirmante: true,
  nombreFirmante: "Nombre del Firmante",
  mostrarNumeroPagina: true,
  delaySeconds: 5,
  exportTimeoutSeconds: 15,
  certPath: "",
  certPassword: "",
  motivo: "Firma Digital",
  ubicacion: "Ciudad, País",
  openAfterSigning: true,
  signatureMode: "approval",
  signatureModeChosen: false,
  jurisdiction: "international",
};

interface SignatureSettingRow {
  name: string;
  desc?: string;
  render: (setting: Setting) => void | (() => void);
}

export class PdfSignatureSettingTab extends PluginSettingTab {
  plugin: PdfDigitalSignaturePlugin;
  private certificateStatusEl?: HTMLElement;
  private certificateStatusTimer?: number;

  constructor(app: App, plugin: PdfDigitalSignaturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SignatureSettingRow[] {
    const plugin = this.plugin;
    const row = (name: TranslationKey, desc: TranslationKey, render: SignatureSettingRow["render"]): SignatureSettingRow =>
      ({ name: t(name), desc: t(desc), render });
    const toggle = (key: "firmarCriptograficamente" | "mostrarNombreFirmante" | "mostrarNumeroPagina" | "openAfterSigning",
      name: TranslationKey, desc: TranslationKey): SignatureSettingRow => row(name, desc, setting => {
        setting.addToggle(control => control.setValue(plugin.settings[key]).onChange(async value => {
          plugin.settings[key] = value;
          await plugin.saveSettings();
        }));
      });
    const refreshCertificate = () => {
      const host = this.certificateStatusEl?.parentElement;
      if (host) this.scheduleCertificateStatusRefresh(host);
    };
    const text = (key: "nombreFirmante" | "certPath" | "motivo" | "ubicacion", name: TranslationKey,
      desc: TranslationKey, placeholder?: TranslationKey, trim = false): SignatureSettingRow => row(name, desc, setting => {
        setting.addText(control => {
          if (placeholder) control.setPlaceholder(t(placeholder));
          control.setValue(plugin.settings[key]).onChange(async value => {
            plugin.settings[key] = trim ? value.trim() : value;
            if (key === "certPath") refreshCertificate();
            await plugin.saveSettings();
          });
        });
      });
    return [
      row("settings_title", "settings_desc", setting => { setting.setHeading(); }),
      toggle("firmarCriptograficamente", "settings_default_toggle_name", "settings_default_toggle_desc"),
      row("settings_signature_mode_name", "settings_signature_mode_desc", setting => { configureSigningMode(setting, plugin); }),
      { name: t("settings_jurisdiction_name"), desc: getJurisdictionGuidance(plugin.settings.jurisdiction),
        render: setting => { configureJurisdiction(setting, plugin); } },
      { name: t("settings_signature_levels_desc"), render: setting => {
        setting.settingEl.empty();
        setting.settingEl.addClass("pdf-sig-settings-description");
        setting.settingEl.createEl("p", { cls: "setting-item-description", text: t("settings_signature_levels_desc") });
      } },
      toggle("mostrarNombreFirmante", "settings_signer_toggle_name", "settings_signer_toggle_desc"),
      text("nombreFirmante", "settings_signer_name_name", "settings_signer_name_desc", "default_signer_name", true),
      toggle("mostrarNumeroPagina", "settings_page_number_name", "settings_page_number_desc"),
      row("settings_delay_name", "settings_delay_desc", setting => {
        setting.addSlider(control => control.setLimits(5, 60, 1).setValue(plugin.settings.exportTimeoutSeconds).onChange(async value => {
          plugin.settings.exportTimeoutSeconds = value;
          await plugin.saveSettings();
        }));
      }),
      toggle("openAfterSigning", "settings_open_after_name", "settings_open_after_desc"),
      { name: t("settings_cert_section_title"), render: setting => { setting.setHeading(); } },
      { name: t("settings_cert_status_title"), desc: t("settings_cert_path_desc"), render: setting => {
        const host = setting.settingEl;
        host.empty(); host.addClass("pdf-sig-settings-description");
        this.renderCertificateStatus(host);
        return () => {
          this.cancelCertificateStatusRefresh();
          if (this.certificateStatusEl?.parentElement === host) this.certificateStatusEl = undefined;
        };
      } },
      text("certPath", "settings_cert_path_name", "settings_cert_path_desc", "cert_private_path", true),
      row("settings_cert_password_name", "settings_cert_password_desc", setting => {
        // Keep this custom handler: declarative auto-binding would persist the secret in data.json.
        setting.addText(control => {
          control.inputEl.type = "password";
          control.setValue(plugin.settings.certPassword).onChange(async value => {
            const saving = plugin.setCertificatePassword(value);
            refreshCertificate();
            await saving;
          });
        });
      }),
      text("motivo", "settings_reason_name", "settings_reason_desc"),
      text("ubicacion", "settings_location_name", "settings_location_desc"),
      row("settings_btn_generate", "settings_btn_generate_desc", setting => {
        setting.addButton(button => button.setButtonText(t("settings_btn_generate")).setCta().onClick(async () => {
          button.setDisabled(true);
          try {
            await plugin.generateCertificate();
            new Notice(t("notice_cert_generated", { path: plugin.settings.certPath }));
            if (typeof this.update === "function") this.update();
            else this.renderLegacySettings();
          } catch (error: unknown) {
            new Notice(t("notice_cert_gen_error", { error: error instanceof Error ? error.message : String(error) }));
          } finally { button.setDisabled(false); }
        }));
      }),
    ];
  }

  // Obsidian <1.13 uses the same rows through the imperative fallback.
  display(): void { this.renderLegacySettings(); }

  private renderLegacySettings(): void {
    this.cancelCertificateStatusRefresh();
    this.containerEl.empty();
    for (const definition of this.getSettingDefinitions()) {
      const setting = new Setting(this.containerEl).setName(definition.name);
      if (definition.desc) setting.setDesc(definition.desc);
      definition.render(setting);
    }
  }

  hide(): void {
    this.cancelCertificateStatusRefresh();
  }

  private cancelCertificateStatusRefresh(): void {
    if (this.certificateStatusTimer !== undefined) window.clearTimeout(this.certificateStatusTimer);
    this.certificateStatusTimer = undefined;
  }

  private scheduleCertificateStatusRefresh(containerEl: HTMLElement): void {
    this.cancelCertificateStatusRefresh();
    this.certificateStatusTimer = window.setTimeout(() => {
      this.certificateStatusTimer = undefined;
      this.renderCertificateStatus(containerEl);
    }, 250);
  }

  renderCertificateStatus(containerEl: HTMLElement): void {
    const certPath = this.plugin.settings.certPath.trim()
      ? this.plugin.resolveAbsolutePath(this.plugin.settings.certPath) : "";
    const info = getCertificateInfo(certPath, this.plugin.settings.certPassword);

    const statusEl = this.certificateStatusEl?.parentElement === containerEl
      ? this.certificateStatusEl : containerEl.createDiv({ cls: "pdf-sig-cert-status" });
    this.certificateStatusEl = statusEl;
    statusEl.removeAttribute("style");
    applyStyles(statusEl, {
      padding: "10px 14px",
      marginBottom: "14px",
      borderRadius: "8px",
      fontSize: "var(--font-ui-smaller)",
      overflowWrap: "anywhere",
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
          date: info.notAfter?.toLocaleDateString(getLanguage()) || "N/A",
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
          date: info.notAfter?.toLocaleDateString(getLanguage()) || "N/A",
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
          date: info.notAfter?.toLocaleDateString(getLanguage()) || "N/A",
        })
      );
    } else {
      applyStyles(statusEl, {
        backgroundColor: "rgba(235, 87, 87, 0.15)",
        border: "1px solid rgba(235, 87, 87, 0.4)",
      });
      statusEl.setText(t("settings_cert_status_invalid", { error: info.error || t("error_invalid_cert") }));
    }
    if (info.commonName) statusEl.createEl("p", { text: t("verify_signer", { name: info.commonName }) });
    if (info.issuer) statusEl.createEl("p", { text: t("verify_issuer", { issuer: info.issuer }) });
    if (info.fingerprint) statusEl.createEl("p", { text: t("verify_fingerprint", { fingerprint: info.fingerprint }) });
    if (info.selfSigned !== undefined) statusEl.createEl("p", { text: t(info.selfSigned ? "verify_self_signed" : "certificate_self_signed_no") });
    const location = certificateLocation(this.plugin.getVaultBasePath(), certPath);
    if (location === "inside" || location === "unknown") statusEl.createEl("p", {
      cls: "setting-item-description",
      text: t(location === "inside" ? "cert_location_inside" : "cert_location_unknown"),
    });
  }
}

function configureSigningMode(setting: Setting, plugin: PdfDigitalSignaturePlugin): void {
  setting.setName(t("settings_signature_mode_name")).setDesc(t("settings_signature_mode_desc"))
    .addDropdown(dropdown => dropdown
      .addOption("", t("signature_mode_choose"))
      .addOption("approval", t("signature_mode_approval"))
      .addOption("certify", t("signature_mode_certify"))
      .setValue(plugin.settings.signatureModeChosen === false ? "" : plugin.settings.signatureMode)
      .onChange(async value => {
        plugin.settings.signatureModeChosen = value !== "";
        if (value !== "") plugin.settings.signatureMode = normalizeSignatureMode(value);
        await plugin.saveSettings();
      }));
}

function configureJurisdiction(setting: Setting, plugin: PdfDigitalSignaturePlugin): void {
  setting.setName(t("settings_jurisdiction_name")).setDesc(getJurisdictionGuidance(plugin.settings.jurisdiction))
    .addDropdown(dropdown => dropdown
      .addOption("international", t("jurisdiction_international"))
      .addOption("CL", t("jurisdiction_cl"))
      .addOption("EU", t("jurisdiction_eu"))
      .addOption("UK", t("jurisdiction_uk"))
      .addOption("US", t("jurisdiction_us"))
      .setValue(plugin.settings.jurisdiction)
      .onChange(async value => {
        plugin.settings.jurisdiction = normalizeJurisdiction(value);
        await plugin.saveSettings();
        setting.setDesc(getJurisdictionGuidance(plugin.settings.jurisdiction));
      }));
}

export function renderSigningPolicySettings(containerEl: HTMLElement, plugin: PdfDigitalSignaturePlugin, compact = false): void {
  configureSigningMode(new Setting(containerEl), plugin);
  if (compact) return;
  configureJurisdiction(new Setting(containerEl), plugin);
  containerEl.createEl("p", { cls: "setting-item-description", text: t("settings_signature_levels_desc") });
}
