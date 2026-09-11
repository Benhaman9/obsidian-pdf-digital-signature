import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type PdfDigitalSignaturePlugin from "./main";
import * as path from "path";
import * as fs from "fs";

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
}

export const DEFAULT_SETTINGS: PdfSignatureSettings = {
  firmarPdf: true,
  nombreFirmante: "Benjamín Alcalde G.",
  mostrarNumeroPagina: true,
  delaySeconds: 5,
  certPath: "Scripts/certificado_benjamin.pfx",
  certPassword: "1234",
  motivo: "Documento personal / universitario",
  ubicacion: "Chile",
  openAfterSigning: true,
};

export class PdfSignatureSettingTab extends PluginSettingTab {
  plugin: PdfDigitalSignaturePlugin;

  constructor(app: App, plugin: PdfDigitalSignaturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Firma Digital PDF — Ajustes" });
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Configuración del membrete de pie de página y del certificado digital criptográfico (PAdES / PKCS#7 / X.509).",
    });

    // 1. Activar por defecto
    new Setting(containerEl)
      .setName("Activar firma por defecto al exportar")
      .setDesc("Si está activo, la casilla 'Firmar con certificado digital' vendrá marcada en el diálogo de exportación.")
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
      .setName("Nombre en el pie de página")
      .setDesc("Texto que aparecerá en el pie de página a la izquierda de todas las hojas.")
      .addText((text) =>
        text
          .setPlaceholder("Benjamín Alcalde G.")
          .setValue(this.plugin.settings.nombreFirmante)
          .onChange(async (val) => {
            this.plugin.settings.nombreFirmante = val.trim() || "Benjamín Alcalde G.";
            await this.plugin.saveSettings();
          })
      );

    // 3. Mostrar número de página
    new Setting(containerEl)
      .setName("Mostrar número de página")
      .setDesc("Muestra 'página / total' a la derecha en el pie de página.")
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
      .setName("Demora antes de firmar (segundos)")
      .setDesc("Tiempo de espera tras el guardado del archivo antes de ejecutar el proceso criptográfico.")
      .addSlider((slider) =>
        slider
          .setLimits(1, 15, 1)
          .setValue(this.plugin.settings.delaySeconds)
          .setDynamicTooltip()
          .onChange(async (val) => {
            this.plugin.settings.delaySeconds = val;
            await this.plugin.saveSettings();
          })
      );

    // 5. Abrir visor tras firmar
    new Setting(containerEl)
      .setName("Abrir PDF tras firmar")
      .setDesc("Abre el archivo PDF automáticamente en tu lector predeterminado una vez firmado.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openAfterSigning)
          .onChange(async (val) => {
            this.plugin.settings.openAfterSigning = val;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Certificado Digital (.pfx / .p12)" });

    // 6. Ruta del certificado
    new Setting(containerEl)
      .setName("Ruta del certificado digital")
      .setDesc("Ruta relativa a la bóveda o ruta absoluta a tu archivo de certificado .pfx o .p12.")
      .addText((text) =>
        text
          .setPlaceholder("Scripts/certificado_benjamin.pfx")
          .setValue(this.plugin.settings.certPath)
          .onChange(async (val) => {
            this.plugin.settings.certPath = val.trim();
            await this.plugin.saveSettings();
          })
      );

    // 7. Contraseña del certificado
    new Setting(containerEl)
      .setName("Contraseña del certificado")
      .setDesc("Contraseña para descifrar la clave privada del archivo .pfx.")
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
      .setName("Motivo de la firma (Reason)")
      .setDesc("Metadato que figurará en el panel de firma de Adobe Acrobat / Foxit.")
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
      .setName("Lugar / Ubicación (Location)")
      .setDesc("Ubicación geográfica del firmante (ej. Chile).")
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
      .setName("Generar o actualizar certificado (.pfx)")
      .setDesc("Crea un certificado digital autofirmado X.509 en la ruta indicada con la contraseña actual, directamente en JavaScript.")
      .addButton((btn) =>
        btn.setButtonText("Generar Certificado").setCta().onClick(async () => {
          btn.setDisabled(true);
          try {
            await this.plugin.generateCertificate();
            new Notice("✅ Certificado generado con éxito en " + this.plugin.settings.certPath);
          } catch (err: any) {
            new Notice("❌ Error generando certificado: " + (err.message || err));
          } finally {
            btn.setDisabled(false);
          }
        })
      );
  }
}
