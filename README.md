# PDF Digital Signature for Obsidian

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20JS)-brightgreen.svg)]()
[![Platform: Desktop](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

**PDF Digital Signature** is a lightweight, **zero-dependency** plugin for [Obsidian](https://obsidian.md) that seamlessly integrates cryptographic digital signatures (PAdES / PKCS#7 / X.509) and custom running footers into your exported PDF documents.

When opened in standard PDF viewers like **Adobe Acrobat Reader**, documents are recognized as **"Signed and all signatures are valid"**, guaranteeing document authenticity, integrity, and author attribution.

---

## ✨ Features

- 🔏 **True Cryptographic Signatures (PAdES / PKCS#7):**  
  Uses standard X.509 digital certificates (`.pfx` / `.p12`). Ensures full cryptographic document integrity and non-repudiation.
- 📄 **Running Footers on Every Page:**  
  Stamps your name (or custom text) on the bottom-left and running page numbers (`page / total`) on the bottom-right across all pages.
- ⚡ **100% Portable & Zero Dependencies:**  
  Built entirely in pure TypeScript/JavaScript (`node-forge` + `pdf-lib` + `@signpdf`). No Python, no OpenSSL, no terminal commands required.
- 🌐 **Multi-Language Support (i18n):**  
  Full native translations in **English (`en`)**, **Spanish (`es`)**, **Portuguese (`pt`)**, and **Italian (`it`)**, automatically matching your Obsidian display language.
- ⏳ **Expiration Warnings & 1-Click Renewal:**  
  Monitors certificate validity and shows proactive alerts when your certificate has **30 days or less remaining**, with an instant renewal button.
- 🎛️ **Native Integration:**  
  Hooks directly into Obsidian's built-in **"Export to PDF"** dialog with a toggle that remembers your preferences.
- ⏱️ **Automated Post-Processing:**  
  Optionally waits a customizable delay (default: 5 seconds) after export to ensure safe disk writes, applies the signature, and opens the signed PDF in your default viewer.
- 🔑 **Built-in Certificate Generator:**  
  Don't have a commercial certificate yet? Generate a self-signed 3-year certificate with 1 click directly in the plugin settings.
- 🛡️ **100% Private & Offline:**  
  Everything runs locally on your machine. No telemetry, no network calls.

---

## 🚀 How It Works

1. Open any note in Obsidian and trigger the native **Export to PDF** dialog (`Ctrl + P` / `Cmd + P` ➔ *Export to PDF*).
2. You will see a new toggle at the bottom:  
   **"Firmar con certificado digital"** *(Sign with digital certificate)*.
3. Click **Export to PDF** and select your destination.
4. The plugin automatically:
   - Prints the note with your name on the footer of every page.
   - Waits the configured delay (e.g. 5 seconds) and displays a progress notice.
   - Seals the document with your `.pfx` certificate.
   - Opens the finalized, cryptographically valid PDF in Adobe Acrobat Reader.

---

## 🛠️ Installation

### Method 1: Obsidian Community Plugins (Recommended once approved)
1. Open Obsidian **Settings** ➔ **Community plugins**.
2. Search for **PDF Digital Signature**.
3. Click **Install**, then **Enable**.

### Method 2: Via BRAT (Beta Reviewer's Auto-update Tool)
1. Install the **BRAT** community plugin in Obsidian.
2. In BRAT settings, choose **Add Beta plugin**.
3. Paste: `https://github.com/balca/obsidian-pdf-digital-signature`
4. Click **Add Plugin** and enable it.

### Method 3: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/balca/obsidian-pdf-digital-signature/releases).
2. Create a folder named `obsidian-pdf-digital-signature` in your vault's `.obsidian/plugins/` directory.
3. Copy the 3 downloaded files into that folder.
4. Reload Obsidian and enable the plugin under **Community plugins**.

---

## ⚙️ Configuration

In Obsidian's **Settings** ➔ **Firma Digital PDF**:

| Setting | Description | Default |
| :--- | :--- | :--- |
| **Activar firma por defecto** | Whether the signing toggle is pre-checked in the Export dialog. | `true` |
| **Nombre en el pie de página** | The text displayed at the bottom-left of every page. | `Benjamín Alcalde G.` |
| **Mostrar número de página** | Displays `page / total` on the bottom-right. | `true` |
| **Demora antes de firmar** | Seconds to wait before applying the signature. | `5` seconds |
| **Abrir PDF tras firmar** | Automatically opens your default PDF viewer once signed. | `true` |
| **Ruta del certificado digital** | Relative or absolute path to your `.pfx` or `.p12` file. | `Scripts/certificado_benjamin.pfx` |
| **Contraseña del certificado** | Password for decrypting your certificate. | `1234` |
| **Motivo / Ubicación** | Signature metadata displayed in Adobe Acrobat. | Personal / Chile |

### Using an Official Certificate
If you own an accredited digital signature (such as a Firma Electrónica Simple or Avanzada in `.p12` or `.pfx` format), simply place it in your vault or enter its absolute path and password in the settings.

---

## 🧑‍💻 Development

```bash
# Clone the repository
git clone https://github.com/balca/obsidian-pdf-digital-signature.git
cd obsidian-pdf-digital-signature

# Install dependencies
npm install

# Build production bundle
npm run build

# Start dev watcher
npm run dev
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by [Benjamín Alcalde G.](https://github.com/balca)
