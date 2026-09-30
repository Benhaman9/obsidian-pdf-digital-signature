// Optional headless Chromium integration. No desktop window or user profile is used.
// Set PDF_TEST_PLAYWRIGHT, PDF_TEST_CHROMIUM and PDF_TEST_OUTPUT before running.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const forge = require('node-forge');

test('production plugin exports and signs real Chromium PDFs in all control combinations', async () => {
  const { chromium } = require(process.env.PDF_TEST_PLAYWRIGHT || 'playwright');
  const output = process.env.PDF_TEST_OUTPUT;
  assert.ok(output, 'PDF_TEST_OUTPUT must point to an isolated test directory');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PDF_TEST_CHROMIUM, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{font:14pt Arial}section{break-after:page}section:last-child{break-after:auto}</style></head><body><section><h1>Export integration test</h1><p>Page one: French and Spanish accents.</p></section><section><h1>Second page</h1><p>Cryptographic signature and independent footer controls.</p></section></body></html>');
    const notices = [];
    const controls = [];
    const opened = [];
    let onComplete;
    class Modal { open() {} }
    class Plugin { register() {} registerInterval(id) { return id; } }
    class FileSystemAdapter { getBasePath() { return output; } }
    class Setting {
      setName(name) { controls.push(name); return this; }
      setDesc() { return this; }
      addToggle(callback) { callback({ setValue() {}, onChange() {} }); return this; }
    }
    const mock = {
      Modal, Plugin, Setting, FileSystemAdapter, SuggestModal: Modal, PluginSettingTab: class {}, getLanguage: () => 'fr',
      Notice: class {
        constructor(message) {
          notices.push(message);
          if (/^✅ PDF/.test(message)) onComplete?.resolve();
          if (/^❌/.test(message)) onComplete?.reject(new Error(message));
        }
        hide() {}
      },
    };
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8'), {
      module, exports: module.exports, Buffer, Uint8Array, ArrayBuffer, DataView, Date, console, process, global, setTimeout, clearTimeout,
      window: { setTimeout, require: () => ({ shell: { async openPath(file) { opened.push(file); return ''; } } }) },
      require: (id) => id === 'obsidian' ? mock : require(id),
    });
    const plugin = new module.exports.default();
    plugin.app = { vault: { adapter: new FileSystemAdapter() } };
    plugin.loadData = async () => ({});
    plugin.saveData = async () => {};
    await plugin.loadSettings();
    const cases = [
      ['signed-footer', true, true, true],
      ['numbers-only', false, false, true],
      ['name-only', false, true, false],
      ['crypto-only', true, false, false],
      ['plain', false, false, false],
    ];
    const results = [];
    for (const [name, sign, signerName, numbers] of cases) {
      plugin.settings = {
        ...plugin.settings, firmarCriptograficamente: sign, mostrarNombreFirmante: signerName,
        mostrarNumeroPagina: numbers, nombreFirmante: 'François & María <tests>',
        certPath: 'integration.pfx', delaySeconds: 1, openAfterSigning: true,
      };
      const file = path.join(output, name + '.pdf');
      const contentEl = { createDiv() { return { style: {}, createEl() {}, remove() {} }; } };
      let optionsUsed;
      const modal = {
        file: {}, modalEl: { classList: { contains: (cls) => cls === 'mod-narrow' } }, contentEl,
        async printToPdf(options) {
          optionsUsed = options;
          await page.pdf({ path: file, format: 'A4', printBackground: true,
            displayHeaderFooter: Boolean(options.displayHeaderFooter),
            headerTemplate: options.headerTemplate, footerTemplate: options.footerTemplate,
            margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
        },
      };
      plugin.inspectAndEnhanceModal(modal);
      const completion = sign ? new Promise((resolve, reject) => { onComplete = { resolve, reject }; }) : null;
      await modal.printToPdf({ filepath: file, open: true, marginsType: 0 });
      if (completion) {
        let timeout;
        try {
          await Promise.race([completion, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Signing timed out')), 15000); })]);
        } finally { clearTimeout(timeout); }
      }
      const pdf = fs.readFileSync(file);
      assert.equal(/\/ByteRange\s*\[/.test(pdf.toString('latin1')), sign, name);
      assert.equal(Boolean(optionsUsed.footerTemplate), signerName || numbers, name);
      if (sign) {
        assert.equal(optionsUsed.open, false);
        verifySignature(pdf, path.join(output, 'integration.pfx'), plugin.settings.certPassword);
      }
      results.push({ name, signed: sign, signerName, numbers });
    }
    assert.ok(controls.includes('Signer le PDF cryptographiquement'));
    assert.ok(controls.includes('Afficher le nom du signataire'));
    assert.ok(controls.includes('Afficher le numéro de page'));
    // Allow the post-signing openPath microtask to finish.
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(opened.length, 2);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ cases: results, openedViewers: opened.length, frenchControls: true, cryptographicVerification: true }, null, 2));
  } finally { await browser.close(); }
});

function verifySignature(pdf, certificatePath, password) {
  const ranges = pdf.toString('latin1').match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
  assert.equal(ranges[0], 0);
  assert.equal(ranges[2] + ranges[3], pdf.length);
  const content = Buffer.concat([pdf.subarray(0, ranges[1]), pdf.subarray(ranges[2])]);
  const cmsBytes = Buffer.from(pdf.subarray(ranges[1] + 1, ranges[2] - 1).toString('ascii'), 'hex');
  const cms = forge.asn1.fromDer(cmsBytes.toString('binary'), { parseAllBytes: false });
  const info = cms.value[1].value[0].value.at(-1).value[0];
  const attributes = info.value[3];
  const digest = attributes.value.find((attr) => forge.asn1.derToOid(attr.value[0].value) === forge.pki.oids.messageDigest);
  assert.equal(Buffer.from(digest.value[1].value[0].value, 'binary').toString('hex'), crypto.createHash('sha256').update(content).digest('hex'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(fs.readFileSync(certificatePath).toString('binary')), false, password);
  const certificate = p12.safeContents.flatMap((item) => item.safeBags).find((bag) => bag.cert).cert;
  const der = forge.asn1.toDer(forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attributes.value)).getBytes();
  assert.ok(crypto.verify('sha256', Buffer.from(der, 'binary'), forge.pki.publicKeyToPem(certificate.publicKey), Buffer.from(info.value[5].value, 'binary')));
}
