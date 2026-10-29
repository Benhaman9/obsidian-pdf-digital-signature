const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const forge = require('node-forge');
const { PDFDocument } = require('pdf-lib');
const { transformSync } = require('esbuild');

let language = 'en';
const notices = [];
class Modal { open() {} }
class Plugin {
  constructor() {
    const secrets = new Map();
    this.app = { secretStorage: {
      getSecret: (id) => secrets.get(id) ?? null,
      setSecret: (id, value) => secrets.set(id, value),
    } };
  }
  registerInterval(id) { return id; } register() {}
}
class Setting {
  setName() { return this; } setDesc() { return this; }
  addDropdown(callback) { callback({ addOption() { return this; }, setValue() { return this; }, onChange() { return this; } }); return this; }
  addToggle(callback) { callback({ setValue() {}, onChange() {} }); return this; }
}
const mock = {
  getLanguage: () => language, Plugin, Modal, Setting,
  SuggestModal: Modal, PluginSettingTab: class {}, FileSystemAdapter: class {},
  Notice: class { constructor(message) { notices.push(message); } hide() {} },
};
const modules = new Map();
const timers = [];
const mockWindow = { setTimeout(callback) { timers.push(callback); return timers.length; } };
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} };
  modules.set(name, module);
  const code = transformSync(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2020' }).code;
  vm.runInNewContext(code, {
    module, exports: module.exports, Buffer, console,
    window: mockWindow,
    require(id) { return id === 'obsidian' ? mock : id.startsWith('./') ? load(id.slice(2)) : require(id); },
  }, { filename: name + '.ts' });
  return module.exports;
}
const i18n = load('i18n');
const signer = load('signer');
const { validateXRefEntries, decodedCapacity, withPdfDecodeBudget, MAX_DECODED_STREAM_BYTES } = load('pdf-limits');

test('decoded PDF capacity is bounded before allocation and budgets are per document', async () => {
  assert.equal(decodedCapacity(513, 512, 512), 1024);
  assert.equal(decodedCapacity(100, 512, 512), 512);
  assert.throws(() => decodedCapacity(MAX_DECODED_STREAM_BYTES + 1, 0, 512), /budget/);
  assert.throws(() => decodedCapacity(1, 0, MAX_DECODED_STREAM_BYTES + 1), /budget/);
  const DecodeStream = require('pdf-lib/cjs/core/streams/DecodeStream').default;
  await withPdfDecodeBudget(async () => {
    const first = new DecodeStream(); first.ensureBuffer(512); first.ensureBuffer(1);
    const second = new DecodeStream(); second.ensureBuffer(512);
    assert.throws(() => new DecodeStream().ensureBuffer(1), /document budget/);
  }, 1024);
  await Promise.all([1, 2].map(() => withPdfDecodeBudget(async () => {
    await Promise.resolve();
    assert.equal(new DecodeStream().ensureBuffer(512).length, 512);
  }, 512)));
});

test('XRef parser rejects amplified counts and malformed widths before allocation', async () => {
  const parser = (length, widths = [1, 1, 1], available = 3) => ({
    byteWidths: widths, subsections: [{ firstObjectNumber: 0, length }],
    bytes: { length: available, offset: () => 0 },
  });
  assert.doesNotThrow(() => validateXRefEntries(parser(1)));
  assert.doesNotThrow(() => validateXRefEntries(parser(3, [0, 0, 0], 0)));
  for (const value of [parser(1e9), parser(1e9, [0, 0, 0], 0), parser(2),
    parser(-1), parser(1.5), parser(1, [1, -1, 1]), parser(1, [1, 1, 1, 1]),
    parser(1, [1000000000, 0, 0])]) {
    assert.throws(() => validateXRefEntries(value));
  }
  const multiple = parser(1);
  multiple.subsections.push({ firstObjectNumber: 5, length: 100000 });
  assert.throws(() => validateXRefEntries(multiple));
  const malformed = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /XRef /Size 1000000000 /W [1 1 1] /Length 0 >>\nstream\n\nendstream\nendobj\nstartxref\n9\n%%EOF');
  await assert.rejects(PDFDocument.load(malformed, { throwOnInvalidObject: true }), /Trying to parse invalid object/);
  const valid = await PDFDocument.create();
  valid.addPage();
  const bytes = await valid.save(); // Compressed XRef stream, not just classic xref.
  assert.equal((await PDFDocument.load(bytes, { throwOnInvalidObject: true })).getPageCount(), 1);
});
const PluginClass = load('main').default;
const defaults = load('settings').DEFAULT_SETTINGS;

test('all five translations have the same keys and interpolation parameters', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/i18n.ts'), 'utf8');
  const dictionaries = [...source.matchAll(/const (en|es|pt|it|fr): Record<TranslationKey, string> = (\{[\s\S]*?\n\});/g)]
    .map((match) => [match[1], vm.runInNewContext('(' + match[2] + ')')]);
  assert.equal(dictionaries.length, 5);
  const base = dictionaries[0][1];
  for (const [lang, dictionary] of dictionaries) {
    assert.deepEqual(Object.keys(dictionary).sort(), Object.keys(base).sort(), lang);
    for (const key of Object.keys(base)) {
      assert.ok(dictionary[key].trim(), lang + ': ' + key);
      assert.deepEqual((dictionary[key].match(/\{\w+\}/g) || []).sort(), (base[key].match(/\{\w+\}/g) || []).sort(), lang + ': ' + key);
    }
  }
  language = 'fr-CA';
  assert.equal(i18n.getLanguage(), 'fr');
  assert.equal(i18n.t('error_pdf_missing', { path: '$&-$1-$`' }), 'Le fichier PDF n’existe pas : $&-$1-$`');
  language = 'unknown';
  assert.equal(i18n.getLanguage(), 'en');
});

test('generated certificate signs a PDF with a verifiable detached CMS signature', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-signature-test-'));
  try {
    const cert = signer.createSelfSignedCertificate('François & María', 'test-password');
    const certPath = path.join(dir, 'certificate.pfx');
    fs.writeFileSync(certPath, cert);
    assert.equal(signer.getCertificateInfo(certPath, 'test-password').commonName, 'François & María');
    assert.equal(signer.getCertificateInfo(certPath, 'wrong').valid, false);
    const pdf = await PDFDocument.create(); pdf.addPage();
    const result = await signer.signPdfBuffer(Buffer.from(await pdf.save()), cert, 'test-password', { signerName: 'François & María', location: '' });
    const ranges = result.toString('latin1').match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
    const content = Buffer.concat([result.subarray(ranges[0], ranges[0] + ranges[1]), result.subarray(ranges[2], ranges[2] + ranges[3])]);
    const hex = result.subarray(ranges[1] + 1, ranges[2] - 1).toString('ascii');
    const cms = forge.asn1.fromDer(Buffer.from(hex, 'hex').toString('binary'), { parseAllBytes: false });
    const signedData = cms.value[1].value[0];
    const signerInfo = signedData.value.at(-1).value[0];
    const attributes = signerInfo.value[3];
    const digestAttr = attributes.value.find((attr) => forge.asn1.derToOid(attr.value[0].value) === forge.pki.oids.messageDigest);
    assert.equal(Buffer.from(digestAttr.value[1].value[0].value, 'binary').toString('hex'), crypto.createHash('sha256').update(content).digest('hex'));
    const signedAttributes = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attributes.value);
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(cert.toString('binary')), false, 'test-password');
    const certificate = p12.safeContents.flatMap((c) => c.safeBags).find((b) => b.cert).cert;
    assert.ok(crypto.verify('sha256', Buffer.from(forge.asn1.toDer(signedAttributes).getBytes(), 'binary'), forge.pki.publicKeyToPem(certificate.publicKey), Buffer.from(signerInfo.value[5].value, 'binary')));
    await assert.rejects(signer.signPdfBuffer(result, cert, 'test-password', { signerName: 'Second' }), /already contains a signature/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('refuses an empty password and certificates outside their validity period', async () => {
  assert.throws(() => signer.createSelfSignedCertificate('Test', ''), /password/);
  const pdf = await PDFDocument.create(); pdf.addPage();
  const pdfBytes = Buffer.from(await pdf.save());
  const original = signer.createSelfSignedCertificate('Test', 'test');
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(original.toString('binary')), false, 'test');
  const bags = p12.safeContents.flatMap((content) => content.safeBags);
  const key = bags.find((bag) => bag.key).key;
  const cert = bags.find((bag) => bag.cert).cert;
  const makeP12 = () => {
    cert.sign(key, forge.md.sha256.create());
    return Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(key, cert, 'test', { algorithm: '3des' })).getBytes(), 'binary');
  };
  cert.validity.notAfter = new Date(Date.now() - 86400000);
  await assert.rejects(signer.signPdfBuffer(pdfBytes, makeP12(), 'test', { signerName: 'Test' }), /expired/);
  cert.validity.notBefore = new Date(Date.now() + 86400000);
  cert.validity.notAfter = new Date(Date.now() + 172800000);
  await assert.rejects(signer.signPdfBuffer(pdfBytes, makeP12(), 'test', { signerName: 'Test' }), /not yet valid/);
  await assert.rejects(signer.signPdfBuffer(pdfBytes, original, 'wrong', { signerName: 'Test' }), /Invalid certificate/);
});

test('certificate status uses the signing leaf, checks future validity and expiry to the millisecond', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-cert-test-'));
  try {
    const pfx = signer.createSelfSignedCertificate('Leaf', 'test');
    const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(pfx.toString('binary')), false, 'test');
    const bags = p12.safeContents.flatMap((c) => c.safeBags);
    const key = bags.find((b) => b.key).key;
    const cert = bags.find((b) => b.cert).cert;
    const certificatePath = path.join(dir, 'cert.pfx');
    function save() {
      cert.sign(key, forge.md.sha256.create());
      fs.writeFileSync(certificatePath, Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(key, cert, 'test', { algorithm: '3des' })).getBytes(), 'binary'));
    }
    cert.validity.notAfter = new Date(Date.now() + 3600000); save();
    const soon = signer.getCertificateInfo(certificatePath, 'test');
    assert.equal(soon.daysRemaining, 1); assert.equal(soon.isExpiringSoon, true); assert.equal(soon.isExpired, false);
    cert.validity.notAfter = new Date(Date.now() - 3600000); save();
    assert.equal(signer.getCertificateInfo(certificatePath, 'test').isExpired, true);
    assert.equal(signer.getCertificateInfo(certificatePath, 'test').valid, false);
    cert.validity.notBefore = new Date(Date.now() + 86400000);
    cert.validity.notAfter = new Date(Date.now() + 172800000); save();
    assert.equal(signer.getCertificateInfo(certificatePath, 'test').valid, false);
    assert.equal(signer.getCertificateInfo(certificatePath, 'test').isExpiringSoon, false);
    const other = forge.pki.createCertificate();
    const otherKeys = forge.pki.rsa.generateKeyPair(1024);
    other.publicKey = otherKeys.publicKey; other.serialNumber = '02';
    other.setSubject([{ name: 'commonName', value: 'Unrelated CA' }]); other.setIssuer(other.subject.attributes);
    other.sign(otherKeys.privateKey, forge.md.sha256.create());
    cert.validity.notBefore = new Date(Date.now() - 86400000); cert.sign(key, forge.md.sha256.create());
    fs.writeFileSync(certificatePath, Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(key, [other, cert], 'test', { algorithm: '3des' })).getBytes(), 'binary'));
    assert.equal(signer.getCertificateInfo(certificatePath, 'test').commonName, 'Leaf');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('failed replacement never deletes the original PDF and cleans the temporary file', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-replace-test-'));
  const originalRename = fs.promises.rename;
  try {
    const certPath = path.join(dir, 'cert.pfx');
    fs.writeFileSync(certPath, signer.createSelfSignedCertificate('Test', 'test'));
    const pdf = await PDFDocument.create(); pdf.addPage();
    const original = Buffer.from(await pdf.save());
    const pdfPath = path.join(dir, 'test.pdf'); fs.writeFileSync(pdfPath, original);
    fs.promises.rename = async () => { throw new Error('simulated sharing violation'); };
    await assert.rejects(signer.signPdfFile(pdfPath, certPath, 'test', { signerName: 'Test' }), /sharing violation/);
    assert.deepEqual(fs.readFileSync(pdfPath), original);
    assert.equal(fs.readdirSync(dir).filter((name) => name.endsWith('.tmp')).length, 0);
  } finally { fs.promises.rename = originalRename; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a PDF modified during signing is preserved, and successful replacement writes a signed PDF', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-change-test-'));
  const originalRead = fs.promises.readFile;
  try {
    const certPath = path.join(dir, 'cert.pfx');
    fs.writeFileSync(certPath, signer.createSelfSignedCertificate('Test', 'test'));
    const pdf = await PDFDocument.create(); pdf.addPage();
    const original = Buffer.from(await pdf.save());
    const pdfPath = path.join(dir, 'test.pdf'); fs.writeFileSync(pdfPath, original);
    let reads = 0;
    const changed = Buffer.from('a newer export');
    fs.promises.readFile = async (file, ...args) => {
      if (file === pdfPath && ++reads === 2) fs.writeFileSync(pdfPath, changed);
      return originalRead.call(fs.promises, file, ...args);
    };
    await assert.rejects(signer.signPdfFile(pdfPath, certPath, 'test', { signerName: 'Test' }), /changed while/);
    assert.deepEqual(fs.readFileSync(pdfPath), changed);
    fs.promises.readFile = originalRead;
    fs.writeFileSync(pdfPath, original);
    await signer.signPdfFile(pdfPath, certPath, 'test', { signerName: 'Test' });
    assert.match(fs.readFileSync(pdfPath).toString('latin1'), /\/ByteRange/);
    assert.equal(fs.readdirSync(dir).filter((name) => name.endsWith('.tmp')).length, 0);
  } finally { fs.promises.readFile = originalRead; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('legacy settings retain independent footer controls during migration', async () => {
  const plugin = new PluginClass();
  plugin.loadData = async () => ({ firmarPdf: false, mostrarNumeroPagina: true, certPassword: 'existing-password' });
  let saved;
  plugin.saveData = async (settings) => { saved = settings; };
  await plugin.loadSettings();
  assert.equal(plugin.settings.firmarCriptograficamente, false);
  assert.equal(plugin.settings.mostrarNombreFirmante, false);
  assert.equal(plugin.settings.mostrarNumeroPagina, false);
  assert.equal(plugin.settings.certPassword, 'existing-password');
  assert.equal(plugin.app.secretStorage.getSecret('obsidian-pdf-digital-signature-certificate-password'), 'existing-password');
  assert.equal(Object.hasOwn(saved, 'certPassword'), false);
});

test('new installations localize defaults and keep the certificate password in SecretStorage', async () => {
  language = 'fr';
  const plugin = new PluginClass();
  plugin.loadData = async () => ({});
  let saved;
  plugin.saveData = async (settings) => { saved = settings; };
  await plugin.loadSettings();
  assert.equal(plugin.settings.nombreFirmante, 'Nom du signataire');
  assert.match(plugin.app.secretStorage.getSecret('obsidian-pdf-digital-signature-certificate-password'), /^[0-9a-f-]{36}$/);
  assert.equal(Object.hasOwn(saved, 'certPassword'), false);
  await plugin.setCertificatePassword('replacement');
  assert.equal(plugin.app.secretStorage.getSecret('obsidian-pdf-digital-signature-certificate-password'), 'replacement');
  assert.equal(Object.hasOwn(saved, 'certPassword'), false);
  language = 'en';
});

test('footer escapes user text and scheduled signing retains export settings', async () => {
  const plugin = new PluginClass();
  plugin.settings = { ...defaults, nombreFirmante: '<b>François & María</b>' };
  const content = { createDiv() { return { style: {}, createEl() {} }; } };
  let captured;
  const modal = { file: {}, modalEl: { classList: { contains: () => true } }, contentEl: content,
    async printToPdf(options) { captured = options; } };
  plugin.checkCertificateExpirationAlert = () => {};
  plugin.inspectAndEnhanceModal(modal);
  let scheduledSettings;
  plugin.scheduleSigning = (_, settings) => { scheduledSettings = settings; };
  await modal.printToPdf({ filepath: 'test.pdf' });
  assert.ok(captured.footerTemplate.includes('&lt;b&gt;François &amp; María&lt;/b&gt;'));
  plugin.settings.nombreFirmante = 'Changed';
  assert.equal(scheduledSettings.nombreFirmante, '<b>François & María</b>');
});

test('native math print hook refreshes after rendering, waits for fonts and restores on unload', async () => {
  const plugin = new PluginClass();
  plugin.settings = { ...defaults, firmarCriptograficamente: true };
  plugin.checkCertificateExpirationAlert = () => {};
  const cleanup = []; plugin.register = fn => cleanup.push(fn);
  const events = [];
  const sourceStyle = {id:'MJX-CHTML-styles',sheet:{cssRules:[]}};
  const source = {getElementById:()=>sourceStyle};
  let fontsReady;
  const targetStyle = {textContent:''};
  const dest = {getElementById:()=>targetStyle,fonts:{ready:new Promise(resolve=>{fontsReady=resolve;})}};
  const rendered = {ownerDocument:dest,querySelector:()=>({}),getBoundingClientRect(){events.push('layout');}};
  let fail = false;
  const modal = {file:{},modalEl:{classList:{contains:()=>true}},
    contentEl:{ownerDocument:source,createDiv(){return {style:{},createEl(){},remove(){}};}},
    async print(){
      if(fail) throw new Error('render failed');
      sourceStyle.sheet.cssRules.push({cssText:'mjx-frac { display: inline-block; }'});
      events.push('render');return rendered;
    },
    async printToPdf(){try{await this.print({}, {},false);events.push('pdf');}catch{}},
  };
  const originalPrint = modal.print;
  const originalPrintToPdf = modal.printToPdf;
  let signed=0;plugin.scheduleSigning=()=>signed++;
  plugin.inspectAndEnhanceModal(modal);
  const job=modal.printToPdf({filepath:'test.pdf'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(targetStyle.textContent,/mjx-frac/);
  assert.equal(events.includes('pdf'),false,'Printing waits for fonts');
  fontsReady();await job;
  assert.deepEqual(events,['render','layout','pdf']);
  assert.equal(signed,1);
  fail=true;
  await modal.printToPdf({filepath:'test.pdf'});
  assert.equal(signed,1,'A swallowed native render error must not sign an old PDF');
  cleanup.forEach(fn=>fn());
  assert.equal(modal.print,originalPrint);
  assert.equal(modal.printToPdf,originalPrintToPdf);
});

test('signing jobs deduplicate and catch rejected file dialogs', async () => {
  const plugin = new PluginClass();
  plugin.settings = { ...defaults };
  const queueDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-queue-test-'));
  const queued = path.join(queueDir, 'same.pdf'); fs.writeFileSync(queued, 'test PDF');
  plugin.scheduleSigning(queued); plugin.scheduleSigning(queued);
  assert.equal(timers.length, 1);
  assert.ok(notices.includes('This PDF is already waiting to be signed.'));
  // No global Electron remote is required for normal signing.
  plugin.executeDigitalSignature = async () => {};
  await timers[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(plugin.pendingSigning.size, 0);
  mockWindow.require = () => ({ remote: { dialog: { showOpenDialog: async () => { throw new Error('dialog rejected'); } } } });
  await plugin.promptSignExistingPdf();
  assert.match(notices.at(-1), /Error opening the file picker: (Error: )?dialog rejected/);
  delete mockWindow.require;
  fs.rmSync(queueDir, { recursive: true, force: true });
});


test('a missing configured certificate never silently becomes a self-signed identity', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-missing-cert-'));
  try {
    const plugin = new PluginClass();
    const certPath = path.join(dir, 'provider.pfx');
    const pdfPath = path.join(dir, 'document.pdf');
    fs.writeFileSync(pdfPath, Buffer.from('untouched original'));
    plugin.settings = { ...defaults, certPath };
    await assert.rejects(plugin.executeDigitalSignature(pdfPath), /certificate file does not exist/);
    assert.equal(fs.existsSync(certPath), false);
    assert.equal(fs.readFileSync(pdfPath).toString(), 'untouched original');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('signature policy migrates safely and keeps the selected legal context independent', async () => {
  const plugin = new PluginClass();
  plugin.saveData = async () => {};
  plugin.loadData = async () => ({ firmarCriptograficamente: true, signatureMode: 'approval', jurisdiction: 'CL', ubicacion: 'Custom place' });
  await plugin.loadSettings();
  assert.equal(plugin.settings.signatureMode, 'approval');
  assert.equal(plugin.settings.jurisdiction, 'CL');
  assert.equal(plugin.settings.ubicacion, 'Custom place');
  plugin.loadData = async () => ({ firmarCriptograficamente: true, signatureMode: 'qualified', jurisdiction: 'invalid' });
  await plugin.loadSettings();
  assert.equal(plugin.settings.signatureMode, 'certify');
  assert.equal(plugin.settings.jurisdiction, 'international');
});


test('queued signing rejects a replacement PDF and unloading cancels pending work', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-queue-replace-'));
  try {
    const filename = path.join(dir, 'same.pdf'); fs.writeFileSync(filename, 'export A');
    const plugin = new PluginClass(); plugin.settings = { ...defaults };
    let signed = 0; plugin.executeDigitalSignature = async () => { signed++; };
    const before = timers.length;
    plugin.scheduleSigning(filename);
    fs.writeFileSync(filename, 'export B');
    await timers[before](); await new Promise(resolve => setImmediate(resolve));
    assert.equal(signed, 0);
    assert.ok(notices.some(message => message.includes(i18n.t('notice_pending_changed'))));
    plugin.scheduleSigning(filename);
    plugin.onunload();
    await timers[before + 1](); await new Promise(resolve => setImmediate(resolve));
    assert.equal(signed, 0);
    assert.equal(plugin.pendingSigning.size, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('empty certificate settings do not break alerts and generating never replaces an existing identity', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-cert-preserve-'));
  try {
    const plugin = new PluginClass(); plugin.settings = { ...defaults, certPath: '' };
    assert.doesNotThrow(() => plugin.checkCertificateExpirationAlert());
    const provider = path.join(dir, 'provider.pfx'); fs.writeFileSync(provider, 'original provider identity');
    plugin.settings.certPath = provider; plugin.settings.certPassword = 'test-password';
    plugin.saveData = async () => {};
    const generated = await plugin.generateCertificate();
    assert.notEqual(generated, provider);
    assert.equal(fs.readFileSync(provider).toString(), 'original provider identity');
    assert.equal(plugin.settings.certPath, generated);
    assert.equal(signer.getCertificateInfo(generated, 'test-password').selfSigned, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});


test('a locked Windows destination falls back to a signed copy only for rename access failures', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-locked-destination-'));
  const rename = fs.promises.rename; const writeFile = fs.promises.writeFile;
  try {
    const input = path.join(dir, 'document.pdf'); const certPath = path.join(dir, 'certificate.pfx');
    const pdf = await PDFDocument.create(); pdf.addPage(); const original = Buffer.from(await pdf.save());
    fs.writeFileSync(input, original); fs.writeFileSync(certPath, signer.createSelfSignedCertificate('Test', 'test'));
    const plugin = new PluginClass(); plugin.settings = { ...defaults, certPath, certPassword: 'test' };
    fs.promises.rename = async () => { throw Object.assign(new Error('locked'), { syscall: 'rename', code: 'EPERM' }); };
    const output = await plugin.executeDigitalSignature(input);
    assert.equal(output, path.join(dir, 'document.signed.pdf'));
    assert.deepEqual(fs.readFileSync(input), original);
    assert.equal(load('verifier').inspectPdfSignature(fs.readFileSync(output)).status, 'intact');
    fs.promises.writeFile = async () => { throw Object.assign(new Error('cannot create'), { syscall: 'open', code: 'EPERM' }); };
    await assert.rejects(plugin.executeDigitalSignature(input), /cannot create/);
    assert.equal(fs.readdirSync(dir).filter(name => name.includes('.signed')).length, 1);
  } finally { fs.promises.rename = rename; fs.promises.writeFile = writeFile; fs.rmSync(dir, { recursive: true, force: true }); }
});
