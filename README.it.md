# Firma Digitale PDF per Obsidian

> **Lingue / Languages / Idiomas:**  
> 🇮🇹 **Italiano** | 🇬🇧 [English](README.md) | 🇪🇸 [Español](README.es.md) | 🇧🇷 [Português](README.pt.md)

---

[![License: MIT](https://img.shields.io/badge/Licenza-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
[![Zero Dependencies](https://img.shields.io/badge/Dipendenze-Zero%20(JS%20Puro)-brightgreen.svg)]()
[![Platform: Desktop](https://img.shields.io/badge/Piattaforma-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Lingue](https://img.shields.io/badge/Lingue-IT%20%7C%20EN%20%7C%20ES%20%7C%20PT-orange.svg)]()

**PDF Digital Signature** è un plugin leggero e **senza dipendenze esterne** per [Obsidian](https://obsidian.md) che integra in modo nativo firme digitali crittografiche (standard PAdES / PKCS#7 / X.509) e piè di pagina personalizzati nei documenti PDF esportati.

All'apertura in lettori standard come **Adobe Acrobat Reader**, i file vengono riconosciuti come **«Firmato e tutte le firme sono valide»**, garantendo autenticità, integrità e paternità dei documenti.

---

## ✨ Caratteristiche

- 🔏 **Vere Firme Crittografiche (PAdES / PKCS#7):**  
  Utilizza certificati digitali standard X.509 (`.pfx` / `.p12`). Garantisce l'integrità del documento contro modifiche non autorizzate.
- 📄 **Piè di Pagina Continuo su Tutte le Pagine:**  
  Appone il tuo nome (o testo personalizzato) in basso a sinistra e la numerazione (`pagina / totale`) a destra su ogni foglio.
- ⚡ **100% Portatile e Senza Dipendenze Esterne:**  
  Sviluppato interamente in TypeScript/JavaScript puro (`node-forge` + `pdf-lib` + `@signpdf`). Non richiede Python, pip o comandi da terminale.
- 🌐 **Supporto Multilingue Nativo (i18n):**  
  Traduzione completa in **Italiano (`it`)**, **Inglese (`en`)**, **Spagnolo (`es`)** e **Portoghese (`pt`)**, adattandosi automaticamente alla lingua di Obsidian.
- ⏳ **Monitoraggio Scadenza e Avvisi di Rinnovo (<= 30 giorni):**  
  Avvisa in modo proattivo quando mancano **30 giorni o meno alla scadenza** del certificato, con pulsante di rinnovo in 1 clic.
- 🎛️ **Integrazione Nativa in Obsidian:**  
  Appare come opzione nella finestra ufficiale **«Esporta in PDF»** e ricorda la tua preferenza.
- ⏱️ **Automazione Intelligente:**  
  Attende un intervallo configurabile (predefinito: 5 secondi) per la scrittura sicura su disco, applica la firma e apre il PDF firmato nel lettore predefinito.
- 🔑 **Generatore di Certificati Integrato:**  
  Genera un certificato autofirmato valido per 3 anni direttamente dalle impostazioni del plugin.
- 🛡️ **100% Privato e Offline:**  
  Tutti i calcoli crittografici avvengono localmente sul tuo computer. Nessuna telemetria o chiamata cloud.

---

## 🚀 Come Funziona

1. Apri una nota in Obsidian e premi `Ctrl + P` (o `Cmd + P`) ➔ **Esporta in PDF**.
2. Spunta l'opzione: **«Firma con certificato digitale»**.
3. Clicca su **Esporta in PDF** e scegli dove salvare il file.
4. Il plugin automaticamente:
   - Esporta la nota con il tuo nome nel piè di pagina di ogni pagina.
   - Mostra un conto alla rovescia di 5 secondi.
   - Applica la firma con il certificato `.pfx`.
   - Apre il PDF finale firmato con il badge di validità.

---

## 🛠️ Installazione

### Metodo 1: Plugin della Community di Obsidian (Consigliato dopo l'approvazione)
1. Vai su **Impostazioni** ➔ **Plugin della community**.
2. Cerca **PDF Digital Signature**.
3. Clicca su **Installa**, quindi su **Attiva**.

### Metodo 2: Tramite BRAT (Beta Reviewer's Auto-update Tool)
1. Installa il plugin **BRAT** in Obsidian.
2. Nelle impostazioni di BRAT, seleziona **Add Beta plugin**.
3. Incolla: `https://github.com/balca/obsidian-pdf-digital-signature`
4. Clicca su **Add Plugin** e attivalo.

---

## 📄 Licenza

Questo progetto è distribuito sotto la [Licenza MIT](LICENSE).

Creato con ❤️ da [Benjamín Alcalde G.](https://github.com/balca)
