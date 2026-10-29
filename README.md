# PDF Digital Signature for Obsidian

## Signing and checking in 1.1.1

Use the PDF file's context menu or the commands for the active PDF to sign or check it. Signing an existing PDF opens a review of the file, certificate and signature mode, then creates a new .signed.pdf copy (with a unique suffix if needed); the original is preserved. Exported PDFs are signed after export. If a file changes while waiting in the signing queue, the job is refused so the current document is not signed with stale settings. If Windows blocks replacement of an exported PDF, the plugin creates a signed .signed.pdf copy without forcing a write to the locked file; the displayed filename and the PDF opened afterwards refer to that copy.

Certificate details show the subject, issuer and SHA-256 fingerprint stated by the certificate, plus whether it is self-signed. These details help identify the configured certificate; they do not establish identity or trust. Creating a self-signed certificate is an explicit Settings action. If the configured file exists, a new file is chosen and the previous certificate is preserved; this does not renew a provider-issued certificate.

Input limits are 64 MiB per PDF and 4 MiB per PKCS#12 certificate. Signed output is also limited to 64 MiB; a PDF close to the input limit can be rejected after signing increases its size. Before saving, every generated signature must pass the plugin's local cryptographic and complete-file coverage checks. This is an integrity check, not a trust or legal assessment.


## Choosing how to sign

- **Certify — no changes allowed** is the default: it adds a DocMDP certification policy with permission `P=1`. Compatible readers can reject later changes against that policy. Software that ignores it can still edit the PDF.
- **Integrity signature** signs the current revision without certification. A reader may report the original signature as cryptographically valid while also reporting later revisions; inspect the current document's modification status.
- **Country or legal context** changes guidance only, not your certificate, identity, format or legal status. Check the recipient's requirements.

Configure an existing `.pfx`/`.p12` and its password, or explicitly create a self-signed certificate using Settings. Missing certificates are not silently replaced. Self-signed certificates can help with personal integrity checks; recipients must establish trust separately.

Use **Check PDF signature integrity** from the command palette or PDF file menu. It checks supported signatures and complete-file coverage, detecting appended bytes. Unsupported structures receive an explicit unsupported result. It does not validate trust chains, revocation, trusted timestamps, permitted modifications, PAdES compliance or legal sufficiency. For optional independent validation and trust configuration, see [pyHanko's guide](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

Trusted timestamps, PAdES T/LT/LTA, provider tokens and remote signing are unsupported. PAdES B compliance is not claimed. Technical profiles differ from legal signature categories.

References: [ETSI PAdES](https://www.etsi.org/deliver/etsi_EN/319100_319199/31914201/01.02.01_60/en_31914201v010201p.pdf), [European Commission FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ), [Chile — Law 19,799](https://www.bcn.cl/leychile/navegar?idNorma=196640), [UK ICO](https://ico.org.uk/for-organisations/guide-to-eidas/qualified-trust-services/), [US — 15 USC 7001](https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7001%28c%29+edition%3Aprelim%29).

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
- ⏳ **Certificate Expiration Warnings:**
  Monitors certificate validity and shows proactive alerts when your certificate has **30 days or less remaining**, so you can configure a current certificate.
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
2. Create a folder named `pdf-digital-signature` in your vault's `.obsidian/plugins/` directory.
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

A random password is generated on first load. You can change it before creating a certificate; a blank password is refused for new certificates. Obsidian 1.11.5 or newer is required. The password is kept in the vault's local SecretStorage instead of the plugin's `data.json`; existing passwords are migrated when the plugin loads. Configure it separately on each device. Older vault backups or sync history may still contain the former plaintext value, so review those copies and rotate the certificate if it was exposed. Creating a self-signed certificate never overwrites the configured certificate. Expired or not-yet-valid certificates cannot be used to sign. Existing signed PDFs are rejected because this plugin rewrites the PDF rather than adding an incremental signature. The signature uses `adbe.pkcs7.detached`; full PAdES profile conformance, trusted timestamps and long-term validation are not claimed.

Malformed PDF objects are rejected rather than recovered during signing. XRef
streams are checked before allocating entries: safe counts and byte widths,
enough decoded bytes, and at most 100,000 entries per stream. Widths above four
bytes are unsupported by the pinned parser's bitwise implementation. These
limits prevent the reviewed count-amplification path. Version 1.0.13 also caps
decoded stream buffers at 64 MiB each and 128 MiB of cumulative buffer growth
per document load, before allocation, across supported decoding filters.
Documents exceeding these limits fail explicitly. These are parser allocation
guards, not a total process-memory or CPU limit on every PDF feature.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
