import { Modal, Notice, Setting } from "obsidian";
import * as obsidian from "obsidian";
import type PdfDigitalSignaturePlugin from "./main";
import { renderSigningPolicySettings } from "./settings";
import { refreshMathPrintStyles } from "./math-print-styles";
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

export class ObsidianExportAdapter {
  private disabled = false;
  private cleanups = new WeakMap<object, () => void>();
  compatibility: "unchecked" | "available" | "unavailable" = "unchecked";
  constructor(private plugin: PdfDigitalSignaturePlugin) {}
  private disable(): void {
    if (this.disabled) return;
    this.disabled = true;
    this.compatibility = "unavailable";
    new Notice(t("export_integration_unavailable"), 12000);
  }
  install(): void {
    const plugin = this.plugin;
    const adapter = this;
    if (typeof Modal.prototype.open !== "function") { this.disable(); return; }
    const originalModalOpen = Modal.prototype.open;
    let active = true;

    const enhancedOpen = ((plugin: PdfDigitalSignaturePlugin) => {
      return function (this: Modal) {
        const res = originalModalOpen.call(this);
        try {
          if (active && !adapter.disabled) adapter.enhance(this);
        } catch {
          adapter.disable();
        }
        return res;
      };
    })(plugin);
    try { Modal.prototype.open = enhancedOpen; } catch { this.disable(); return; }

    plugin.register(() => {
      active = false;
      if (Modal.prototype.open === enhancedOpen) Modal.prototype.open = originalModalOpen;
    });
  }

  enhance(modal: unknown): void {
    if (this.disabled) return;
    try { this.enhanceSupported(modal); }
    catch {
      try { if (modal && typeof modal === "object") this.cleanups.get(modal)?.(); } catch { /* best-effort rollback */ }
      this.disable();
    }
  }

  private enhanceSupported(modal: unknown): void {
    const plugin = this.plugin;
    if (this.disabled) return;
    const targetModal = modal as {
      file?: unknown;
      modalEl?: HTMLElement;
      printToPdf?: (opts: Record<string, unknown>) => Promise<unknown>;
      print?: (container: HTMLElement, component: unknown, includeName: boolean) => Promise<HTMLElement>;
      _firmaPdfEnhanced?: boolean;
      contentEl: HTMLElement;
    };

    if (targetModal && typeof targetModal.printToPdf === "function" && targetModal.file &&
        (!targetModal.modalEl || !targetModal.contentEl || typeof targetModal.contentEl.createDiv !== "function" ||
          !targetModal.modalEl.classList?.contains("mod-narrow"))) {
      this.disable(); return;
    }
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
    const originalPrintToPdf = targetModal.printToPdf;
    const originalPrint = targetModal.print;
    let settingContainer!: HTMLElement;
    let restoreLayout: (() => void) | undefined;
    const cleanup = () => {
      targetModal.printToPdf = originalPrintToPdf;
      targetModal.print = originalPrint;
      targetModal._firmaPdfEnhanced = false;
      restoreLayout?.();
      settingContainer?.remove?.();
    };
    this.cleanups.set(targetModal, cleanup);
    plugin.register(cleanup);
    targetModal._firmaPdfEnhanced = true;
    this.compatibility = "available";

    if (plugin.settings.firmarCriptograficamente) {
      plugin.checkCertificateExpirationAlert();
    }

    settingContainer = targetModal.contentEl.createDiv({
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
        toggle.setValue(plugin.settings.firmarCriptograficamente);
        toggle.onChange(async (val) => {
          plugin.settings.firmarCriptograficamente = val;
          await plugin.saveSettings();
        });
      });

    renderSigningPolicySettings(settingContainer, plugin, true);

    new Setting(settingContainer)
      .setName(t("modal_signer_name"))
      .setDesc(t("modal_signer_desc"))
      .addToggle((toggle) => {
        toggle.setValue(plugin.settings.mostrarNombreFirmante);
        toggle.onChange(async (val) => {
          plugin.settings.mostrarNombreFirmante = val;
          await plugin.saveSettings();
        });
      });

    new Setting(settingContainer)
      .setName(t("modal_page_number_name"))
      .setDesc(t("modal_page_number_desc"))
      .addToggle((toggle) => {
        toggle.setValue(plugin.settings.mostrarNumeroPagina);
        toggle.onChange(async (val) => {
          plugin.settings.mostrarNumeroPagina = val;
          await plugin.saveSettings();
        });
      });


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

    let exporting = false;
    targetModal.printToPdf = async (options: Record<string, unknown>) => {
      if (exporting || this.disabled) return;
      if (plugin.settings.firmarCriptograficamente && plugin.settings.signatureModeChosen === false) {
        new Notice(t("signature_choice_required")); return;
      }
      exporting = true;
      try {
      const exportSettings = { ...plugin.settings };
      const shouldSignCryptographically = plugin.settings.firmarCriptograficamente;
      const shouldAddFooter = plugin.settings.mostrarNombreFirmante || plugin.settings.mostrarNumeroPagina;

      if (shouldAddFooter && options) {
        options.displayHeaderFooter = true;
        options.headerTemplate = "<div></div>";

        const pageNumHtml = plugin.settings.mostrarNumeroPagina
          ? `<span style="margin-left: auto;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>`
          : "";
        const signerNameHtml = plugin.settings.mostrarNombreFirmante
          ? `<span>${plugin.settings.nombreFirmante.replace(/[&<>"']/g, (char) => ({
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

      if (shouldSignCryptographically && options && plugin.settings.openAfterSigning) {
        options.open = false;
      }

      renderingFailed = false;
      const result = await originalPrintToPdf.call(targetModal, options);

      if (!renderingFailed && shouldSignCryptographically && options && typeof options.filepath === "string") {
        plugin.scheduleSigning(options.filepath, exportSettings);
      }

      return result;
      } finally { exporting = false; }
    };

  }

}
