# Firma Digitale PDF per Obsidian

> **Lingue / Languages / Idiomas:**
> 🇮🇹 **Italiano** | 🇬🇧 [English](README.md) | 🇪🇸 [Español](README.es.md) | 🇧🇷 [Português](README.pt.md) | 🇫🇷 [Français](README.fr.md)

---

[![License: MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
**Senza strumenti esterni**: JavaScript / TypeScript
[![Platform: Desktop](https://img.shields.io/badge/Piattaforma-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Lingue](https://img.shields.io/badge/Lingue-IT%20%7C%20EN%20%7C%20ES%20%7C%20PT%20%7C%20FR-orange.svg)]()

**PDF Digital Signature** è un plugin leggero e **con librerie JavaScript incluse** per [Obsidian](https://obsidian.md) che integra in modo nativo firme digitali crittografiche (standard PKCS#7 / X.509) e piè di pagina personalizzati nei documenti PDF esportati.

La firma permette di verificare se il contenuto firmato è cambiato. La fiducia nel firmatario dipende dal certificato e dalle impostazioni del lettore. Un certificato autofirmato non è automaticamente attendibile.

---

## ✨ Caratteristiche

- 🔏 **Vere Firme Crittografiche (PKCS#7):**
  X.509 (`.pfx` / `.p12`). Rileva modifiche al contenuto firmato; non impedisce di modificare il PDF.
- 📄 **Piè di Pagina Continuo su Tutte le Pagine:**
  Appone il tuo nome (o testo personalizzato) in basso a sinistra e la numerazione (`pagina / totale`) a destra su ogni foglio.
- 🎛️ **Controlli Indipendenti per Esportazione:**
  Scegli separatamente la firma crittografica, il nome del firmatario e la numerazione delle pagine. Le scelte vengono salvate come predefinite.
- ⚡ **Portatile con librerie incluse:**
  Sviluppato interamente in TypeScript/JavaScript puro (`node-forge` + `pdf-lib` + `@signpdf`). Non richiede Python, pip o comandi da terminale.
- 🌐 **Supporto Multilingue Nativo (i18n):**
  Traduzione completa in **Italiano (`it`)**, **Inglese (`en`)**, **Spagnolo (`es`)**, **Portoghese (`pt`)** e **Francese (`fr`)**, seguendo automaticamente la lingua di Obsidian.
- ⏳ **Monitoraggio Scadenza e Avvisi di Rinnovo (<= 30 giorni):**
  Avvisa in modo proattivo quando mancano **30 giorni o meno alla scadenza** del certificato, con pulsante di rinnovo in 1 clic.
- 🎛️ **Integrazione Nativa in Obsidian:**
  Appare con tre controlli indipendenti nella finestra ufficiale **«Esporta in PDF»** e ricorda la tua preferenza.
- ⏱️ **Automazione Intelligente:**
  Attende un intervallo configurabile (predefinito: 5 secondi) per la scrittura sicura su disco, applica la firma e apre il PDF firmato nel lettore predefinito.
- 🔑 **Generatore di Certificati Integrato:**
  Genera un certificato autofirmato valido per 3 anni direttamente dalle impostazioni del plugin.
- 🛡️ **100% Privato e Offline:**
  Tutti i calcoli crittografici avvengono localmente sul tuo computer. Nessuna telemetria o chiamata cloud.

---

## 🚀 Come Funziona

1. Apri una nota in Obsidian e premi `Ctrl + P` (o `Cmd + P`) ➔ **Esporta in PDF**.
2. Scegli qualsiasi combinazione delle tre opzioni: firma crittografica, nome del firmatario e numerazione.
3. Clicca su **Esporta in PDF** e scegli dove salvare il file.
4. Il plugin automaticamente:
   - Esporta la nota con il tuo nome nel piè di pagina di ogni pagina.
   - Mostra un conto alla rovescia di 5 secondi.
   - Applica la firma con il certificato `.pfx`.
   - Apre il PDF finale firmato se questa opzione è attiva.

---

## 🛠️ Installazione

### Metodo 1: Plugin della Community di Obsidian (Consigliato dopo l'approvazione)
1. Vai su **Impostazioni** ➔ **Plugin della community**.
2. Cerca **PDF Digital Signature**.
3. Clicca su **Installa**, quindi su **Attiva**.

### Metodo 2: Tramite BRAT (Beta Reviewer's Auto-update Tool)
1. Installa il plugin **BRAT** in Obsidian.
2. Nelle impostazioni di BRAT, seleziona **Add Beta plugin**.
3. Incolla: `https://github.com/Benhaman9/obsidian-pdf-digital-signature`
4. Clicca su **Add Plugin** e attivalo.

---

## 📄 Licenza

Questo progetto è distribuito sotto la [Licenza MIT](LICENSE).

Creato con ❤️ da [Benjamín Alcalde G.](https://github.com/Benhaman9)

## Limiti del certificato e della firma

Al primo avvio viene generata una password casuale. Puoi cambiarla prima di creare un certificato. Il plugin la salva in chiaro nelle impostazioni locali; proteggi il vault e i backup. Il rinnovo conserva il certificato precedente in un file `.bak` accanto ad esso. I PDF già firmati vengono rifiutati perché il plugin riscrive il documento invece di aggiungere una firma incrementale. Usa `adbe.pkcs7.detached`; non si dichiara conformità completa ai profili PAdES, marche temporali attendibili o validazione a lungo termine.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
