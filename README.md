# PDF Digital Signature for Obsidian

> **Languages / Idiomas / Lingue:**
> 🇬🇧 **English** | 🇪🇸 [Español](README.es.md) | 🇧🇷 [Português](README.pt.md) | 🇮🇹 [Italiano](README.it.md) | 🇫🇷 [Français](README.fr.md)

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
**No external tools**: JavaScript / TypeScript
[![Platform: Desktop](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20ES%20%7C%20PT%20%7C%20IT%20%7C%20FR-orange.svg)]()

**PDF Digital Signature** is a lightweight plugin with **bundled JavaScript libraries** for [Obsidian](https://obsidian.md) that seamlessly integrates cryptographic digital signatures (PKCS#7 / X.509) and custom running footers into your exported PDF documents.

The signature allows a PDF reader to check whether the signed content has changed. Trust in the signer depends on the certificate and the reader’s trust settings. A self-signed certificate is not automatically trusted.

---

## ✨ Features

- 🔏 **True Cryptographic Signatures (PKCS#7):**
  X.509 (`.pfx` / `.p12`). Detects changes to signed content; it does not prevent editing the PDF.
- 📄 **Running Footers on Every Page:**
  Stamps your name (or custom text) on the bottom-left and running page numbers (`page / total`) on the bottom-right across all pages.
- 🎛️ **Independent Export Controls:**
  Choose cryptographic signing, signer name, and page numbering separately for each PDF. Your choices are remembered as defaults.
- ⚡ **Portable with Bundled Libraries:**
  Built entirely in pure TypeScript/JavaScript (`node-forge` + `pdf-lib` + `@signpdf`). No Python, no OpenSSL, no terminal commands required.
- 🌐 **Multi-Language Support (i18n):**
  Full translations in **English (`en`)**, **Spanish (`es`)**, **Portuguese (`pt`)**, **Italian (`it`)**, and **French (`fr`)**, automatically matching your Obsidian display language.
- ⏳ **Expiration Warnings & 1-Click Renewal:**
  Monitors certificate validity and shows proactive alerts when your certificate has **30 days or less remaining**, with an instant renewal button.
- 🎛️ **Native Integration:**
  Hooks directly into Obsidian's built-in **"Export to PDF"** dialog with three independent controls that remember your preferences.
- ⏱️ **Automated Post-Processing:**
  Optionally waits a customizable delay (default: 5 seconds) after export to ensure safe disk writes, applies the signature, and opens the signed PDF in your default viewer.
- 🔑 **Built-in Certificate Generator:**
  Don't have a commercial certificate yet? Generate a self-signed 3-year certificate with 1 click directly in the plugin settings.
- 🛡️ **100% Private & Offline:**
  Everything runs locally on your machine. No telemetry, no network calls.

---

## 🚀 How It Works

1. Open any note in Obsidian and trigger the native **Export to PDF** dialog (`Ctrl + P` / `Cmd + P` ➔ *Export to PDF*).
2. Choose any combination of the three added options: cryptographic signing, signer name, and page numbering.
3. Click **Export to PDF** and select your destination.
4. The plugin automatically:
   - Prints the note with your name on the footer of every page.
   - Waits the configured delay (e.g. 5 seconds) and displays a progress notice.
   - Seals the document with your `.pfx` certificate.
   - Opens the signed PDF in your default viewer when enabled.

---

## 🛠️ Installation

### Method 1: Obsidian Community Plugins (Recommended once approved)
1. Open Obsidian **Settings** ➔ **Community plugins**.
2. Search for **PDF Digital Signature**.
3. Click **Install**, then **Enable**.

### Method 2: Via BRAT (Beta Reviewer's Auto-update Tool)
1. Install the **BRAT** community plugin in Obsidian.
2. In BRAT settings, choose **Add Beta plugin**.
3. Paste: `https://github.com/Benhaman9/obsidian-pdf-digital-signature`
4. Click **Add Plugin** and enable it.

### Method 3: Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/Benhaman9/obsidian-pdf-digital-signature/releases).
2. Create a folder named `obsidian-pdf-digital-signature` in your vault's `.obsidian/plugins/` directory.
3. Copy the 3 downloaded files into that folder.
4. Reload Obsidian and enable the plugin under **Community plugins**.

---

## ⚙️ Configuration

In Obsidian's **Settings** ➔ **PDF Digital Signature**:

| Setting | Description | Default |
| :--- | :--- | :--- |
| **Cryptographically sign by default** | Applies the PKCS#7 signature independently from footer content. | `true` |
| **Show signer name by default** | Whether the signer name appears at the bottom-left. | `true` |
| **Signer name (Running footer)** | The text displayed when the signer-name option is enabled. | `Name of Signer` |
| **Display page number** | Displays `page / total` on the bottom-right. | `true` |
| **Delay before signing** | Seconds to wait before applying the signature. | `5` seconds |
| **Open PDF after signing** | Automatically opens your default PDF viewer once signed. | `true` |
| **Certificate file path** | Relative or absolute path to your `.pfx` or `.p12` file. | `Scripts/certificado.pfx` |
| **Certificate password** | Password used to decrypt your certificate. | Randomly generated on first load |
| **Reason / Location** | Signature metadata displayed in Adobe Acrobat. | Generic placeholders |

### Using an Official Certificate
If you own an accredited digital signature (such as a commercial X.509 certificate in `.p12` or `.pfx` format), simply place it in your vault or enter its absolute path and password in the settings.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by [Benjamín Alcalde G.](https://github.com/Benhaman9)

## Certificate and signature limitations

A random password is generated on first load. You can change it before creating a certificate. The plugin saves it in plain text in its local settings; protect the vault and its backups. Renewal preserves the previous certificate in a `.bak` file next to it. Existing signed PDFs are rejected because this plugin rewrites the PDF rather than adding an incremental signature. The signature uses `adbe.pkcs7.detached`; full PAdES profile conformance, trusted timestamps and long-term validation are not claimed.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
