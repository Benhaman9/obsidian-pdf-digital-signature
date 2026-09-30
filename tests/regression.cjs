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
class Plugin { registerInterval(id) { return id; } register() {} }
class Setting {
  setName() { return this; } setDesc() { return this; }
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
  plugin.saveData = async () => {};
  await plugin.loadSettings();
  assert.equal(plugin.settings.firmarCriptograficamente, false);
  assert.equal(plugin.settings.mostrarNombreFirmante, false);
  assert.equal(plugin.settings.mostrarNumeroPagina, false);
  assert.equal(plugin.settings.certPassword, 'existing-password');
});

test('new installations localize defaults and persist a random certificate password', async () => {
  language = 'fr';
  const plugin = new PluginClass();
  plugin.loadData = async () => ({});
  let saved;
  plugin.saveData = async (settings) => { saved = settings; };
  await plugin.loadSettings();
  assert.equal(plugin.settings.nombreFirmante, 'Nom du signataire');
  assert.match(saved.certPassword, /^[0-9a-f-]{36}$/);
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

test('signing jobs deduplicate and catch rejected file dialogs', async () => {
  const plugin = new PluginClass();
  plugin.settings = { ...defaults };
  plugin.scheduleSigning('same.pdf'); plugin.scheduleSigning('same.pdf');
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
});
