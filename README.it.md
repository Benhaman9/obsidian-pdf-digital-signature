# Firma Digitale PDF per Obsidian

## Novità della versione 1.2.0

Una nuova installazione richiede di scegliere esplicitamente Firma di integrità o Certifica prima di firmare; la scelta viene ricordata. Le scelte già salvate vengono conservate. Certifica richiede che non vi siano modifiche successive secondo DocMDP P=1; i lettori compatibili valutano questa regola, ma altri programmi possono modificare il PDF.

I nuovi certificati autofirmati usano una directory locale esterna alla cassaforte, separata per cassaforte. I percorsi esistenti vengono conservati senza spostare file. Le impostazioni avvertono se un certificato è nella cassaforte, vi è collegato o la sua posizione non è determinabile. Verifica l’esposizione a sincronizzazioni e backup anche se il percorso sembra esterno. I nuovi PKCS#12 cifrano la chiave privata con AES-256/PBES2, PBKDF2 con PRF SHA-256 e 100.000 iterazioni. Il generatore node-forge usa ancora HMAC-SHA1 per il MAC del contenitore; questa limitazione viene dichiarata senza affermare l’uso di un MAC moderno.

La firma attende un PDF completo e stabile e lo valida invece di imporre un ritardo fisso. Il limite predefinito è di 15 secondi, regolabile da 5 a 60. L’integrazione dell’esportazione è isolata in un adattatore; se non compatibile, i comandi manuali rimangono disponibili. La verifica distingue l’integrità della revisione firmata dalla copertura del file attuale; fiducia, revoca e marche temporali attendibili sono esplicitamente non verificate.

Le prove d’interoperabilità includono PDF sintetici generati indipendentemente con pyHanko e risultati attesi verificati indipendentemente. Un vero PDF con due firme digitali viene segnalato come non supportato da questo verificatore limitato. Non si affermano interoperabilità universale, fiducia nel certificato o sufficienza giuridica. Firma incrementale, servizi TSA e validazione di liste di fiducia non sono supportati.


## Firmare e verificare nella versione 1.1.1

Usa il menu contestuale del file PDF o i comandi del PDF attivo per firmarlo o verificarlo. La firma di un PDF esistente mostra file, certificato e modalità da rivedere, poi crea una copia .signed.pdf (con suffisso univoco se necessario) conservando l'originale. I PDF esportati vengono firmati dopo l'esportazione. Se un file cambia nella coda di firma, l'operazione viene rifiutata per non usare impostazioni precedenti sul documento attuale. Se Windows blocca la sostituzione di un PDF esportato, il plugin crea una copia firmata .signed.pdf senza forzare la scrittura sul file bloccato; il nome mostrato e il PDF aperto in seguito corrispondono a quella copia.

I dettagli del certificato mostrano titolare, emittente e impronta SHA-256 indicati dal certificato, e se è autofirmato. Aiutano a identificare il certificato configurato senza stabilire identità o fiducia. Creare un certificato autofirmato è un'azione esplicita nelle impostazioni. Se il file configurato esiste, viene scelto un altro file e il certificato precedente viene conservato; ciò non rinnova un certificato di un prestatore.

I limiti d'ingresso sono 64 MiB per PDF e 4 MiB per certificato PKCS#12. Anche l'output firmato è limitato a 64 MiB: un PDF vicino al limite d'ingresso può essere rifiutato se la firma aumenta la dimensione. Prima del salvataggio ogni firma generata deve superare i controlli locali crittografici e di copertura dell'intero file. È un controllo d'integrità, non una valutazione di fiducia o giuridica.


## Scegliere come firmare

- **Certifica — nessuna modifica consentita**, scelta esplicita, aggiunge una regola DocMDP con permesso `P=1`. I lettori compatibili possono rifiutare modifiche successive secondo questa regola. I programmi che la ignorano possono comunque modificare il PDF.
- **Firma di integrità** firma la revisione attuale senza certificazione. Un lettore può mostrare la firma originale come crittograficamente valida e segnalare revisioni successive; verifica lo stato delle modifiche del documento attuale.
- **Paese o contesto giuridico** cambia solo l'orientamento, non il certificato, l'identità, il formato o lo status giuridico. Verifica i requisiti del destinatario.

Configura un `.pfx`/`.p12` esistente e la password, oppure crea esplicitamente un certificato autofirmato nelle impostazioni. I certificati mancanti non vengono sostituiti automaticamente. Gli autofirmati possono servire ai controlli personali d'integrità; il destinatario deve stabilire separatamente la fiducia.

Usa **Verifica l'integrità della firma di un PDF** dalla tavolozza dei comandi o dal menu del file PDF. Controlla le firme compatibili e la copertura dell'intero file, rilevando byte aggiunti. Le strutture incompatibili ricevono un risultato esplicito. Non verifica catene di fiducia, revoca, marche temporali attendibili, modifiche consentite, conformità PAdES o sufficienza giuridica. Per la validazione indipendente facoltativa e la configurazione della fiducia, consulta la [guida pyHanko](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

Marche temporali attendibili, PAdES T/LT/LTA, token di prestatori e firma remota non sono supportati. Non si dichiara conformità PAdES B. I profili tecnici differiscono dalle categorie giuridiche.

Riferimenti: [ETSI PAdES](https://www.etsi.org/deliver/etsi_EN/319100_319199/31914201/01.02.01_60/en_31914201v010201p.pdf), [Commissione europea FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ), [Cile — legge 19.799](https://www.bcn.cl/leychile/navegar?idNorma=196640), [ICO britannico](https://ico.org.uk/for-organisations/guide-to-eidas/qualified-trust-services/), [Stati Uniti — 15 USC 7001](https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7001%28c%29+edition%3Aprelim%29).

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
- ⏳ **Monitoraggio Scadenza e Avvisi (<= 30 giorni):**
  Avvisa in modo proattivo quando mancano **30 giorni o meno alla scadenza** del certificato, per consentire di configurare un certificato valido.
- 🎛️ **Integrazione Nativa in Obsidian:**
  Appare con tre controlli indipendenti nella finestra ufficiale **«Esporta in PDF»** e ricorda la tua preferenza.
- ⏱️ **Automazione Intelligente:**
  Attende un PDF completo e stabile entro il limite configurato (15 secondi per impostazione predefinita), lo valida, firma e apre se abilitato.
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
   - Attende e valida il PDF completo, mostrando la fase attuale.
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

Al primo avvio viene generata una password casuale. Puoi cambiarla prima di creare un certificato; una password vuota non è consentita per i nuovi certificati. È richiesto Obsidian 1.11.5 o successivo. La password viene conservata nel SecretStorage locale, fuori da `data.json`; le password precedenti vengono migrate al caricamento del plugin. Deve essere configurata separatamente su ogni dispositivo. La creazione di un certificato autofirmato non sovrascrive mai il certificato configurato. I certificati scaduti o non ancora validi non possono essere usati per firmare. I PDF già firmati vengono rifiutati perché il plugin riscrive il documento invece di aggiungere una firma incrementale. Usa `adbe.pkcs7.detached`; non si dichiara conformità completa ai profili PAdES, marche temporali attendibili o validazione a lungo termine.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
