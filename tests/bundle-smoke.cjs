const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const os = require('node:os');
const crypto = require('node:crypto');
const { PDFDocument } = require('pdf-lib');

test('production bundle loads, migrates the password, and uses French defaults', async () => {
  const module = { exports: {} };
  const mock = {
    Plugin: class { constructor() { const secrets = new Map(); this.app = { secretStorage: { getSecret: (id) => secrets.get(id) ?? null, setSecret: (id, value) => secrets.set(id, value) } }; } }, PluginSettingTab: class {}, SuggestModal: class {}, Modal: class {},
    getLanguage: () => 'fr',
  };
  const sandbox = {
    module, exports: module.exports, Buffer, Uint8Array, ArrayBuffer, DataView, console, process, global, setTimeout, clearTimeout,
    require: (id) => id === 'obsidian' ? mock : require(id),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8') + '\nglobalThis.testPDF = import_pdf_lib.PDFDocument;', sandbox);
  const malformed = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /XRef /Size 1000000000 /W [1 1 1] /Length 0 >>\nstream\n\nendstream\nendobj\nstartxref\n9\n%%EOF');
  await assert.rejects(sandbox.testPDF.load(malformed, { throwOnInvalidObject: true }), /Trying to parse invalid object/);
  const plugin = new module.exports.default();
  plugin.loadData = async () => ({ certPassword: 'existing', firmarCriptograficamente: true });
  let saved;
  plugin.saveData = async (settings) => { saved = settings; };
  await plugin.loadSettings();
  assert.equal(plugin.settings.nombreFirmante, 'Nom du signataire');
  assert.equal(plugin.settings.certPassword, 'existing');
  assert.equal(Object.hasOwn(saved, 'certPassword'), false);
});

test('production signing finishes a multi-page PDF with suspended browser timers', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-suspended-timers-'));
  let timeout;
  try {
    // Cross both the readiness parser's 20-object yield and the writer's
    // 50-object yield. Small fixtures never reached the hidden browser timer.
    const doc = await PDFDocument.create();
    for (let page = 0; page < 60; page++) doc.addPage();
    const file = path.join(folder, 'export.pdf');
    fs.writeFileSync(file, await doc.save({ useObjectStreams: false }));
    const notices = [];
    let hidden = 0, browserTimers = 0;
    const module = { exports: {} };
    const suspendedTimer = () => { browserTimers++; return browserTimers; };
    const mock = {
      Plugin: class {}, PluginSettingTab: class {}, SuggestModal: class {}, Modal: class {},
      getLanguage: () => 'en',
      Notice: class {
        constructor(message) { notices.push(message); }
        setMessage(message) { notices.push(message); }
        hide() { hidden++; }
      },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8'), {
      module, exports: module.exports, AbortController, Buffer, Uint8Array, ArrayBuffer, DataView,
      console, process, global, setTimeout: suspendedTimer, clearTimeout() {},
      window: { setTimeout: suspendedTimer, clearTimeout() {} },
      require: (id) => id === 'obsidian' ? mock : require(id),
    });
    const plugin = new module.exports.default();
    const certificate = path.join(folder, 'test.pfx');
    plugin.settings = { ...plugin.settings, certPath: certificate, certPassword: 'synthetic-test-only',
      nombreFirmante: 'Suspended timer regression', signatureMode: 'approval',
      signatureModeChosen: true, openAfterSigning: false };
    plugin.saveSettings = async () => {};
    await plugin.generateCertificate();
    await Promise.race([
      plugin.scheduleSigning(file),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Signing stalled: ' + JSON.stringify({ browserTimers, notices }))), 15000); }),
    ]);
    assert.ok(notices.some(message => /^✅ PDF/.test(message)), notices.join('\n'));
    assert.equal(hidden, 1, 'persistent progress notice is dismissed');
    assert.equal(plugin.pendingSigning.size, 0, 'destination is released for the next export');
    assert.equal(plugin.signingControllers.size, 0);
    assert.equal(browserTimers, 0, 'PDF parsing and writing must use Node timers');
    const signed = fs.readFileSync(file);
    const ranges = signed.toString('latin1').match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
    assert.equal(ranges[0], 0);
    assert.equal(ranges[2] + ranges[3], signed.length);
    const forge = require('node-forge');
    const cms = forge.asn1.fromDer(Buffer.from(signed.subarray(ranges[1] + 1, ranges[2] - 1).toString('ascii'), 'hex').toString('binary'), { parseAllBytes: false });
    const info = cms.value[1].value[0].value.at(-1).value[0];
    const attrs = info.value[3];
    const digest = attrs.value.find(attr => forge.asn1.derToOid(attr.value[0].value) === forge.pki.oids.messageDigest);
    const content = Buffer.concat([signed.subarray(0, ranges[1]), signed.subarray(ranges[2])]);
    assert.equal(Buffer.from(digest.value[1].value[0].value, 'binary').toString('hex'), crypto.createHash('sha256').update(content).digest('hex'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(fs.readFileSync(certificate).toString('binary')), false, plugin.settings.certPassword);
    const cert = p12.safeContents.flatMap(item => item.safeBags).find(bag => bag.cert).cert;
    const attrsDer = forge.asn1.toDer(forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attrs.value)).getBytes();
    assert.ok(crypto.verify('sha256', Buffer.from(attrsDer, 'binary'), forge.pki.publicKeyToPem(cert.publicKey), Buffer.from(info.value[5].value, 'binary')));
  } finally {
    clearTimeout(timeout);
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
