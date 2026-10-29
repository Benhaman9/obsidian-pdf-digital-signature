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
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} }; modules.set(name, module);
  const code = transformSync(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2020' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, console,
    require(id) { return id === 'obsidian' ? { getLanguage: () => 'en' } : id.startsWith('./') ? load(id.slice(2)) : require(id); },
  });
  return module.exports;
}
const signer = load('signer');
const password = 'temporary-policy-test-password';
const original = signer.createSelfSignedCertificate('Policy fixture', password);
const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(original.toString('binary')), false, password);
const bags = p12.safeContents.flatMap(content => content.safeBags);
const key = bags.find(bag => bag.key).key;
const certificate = bags.find(bag => bag.cert).cert;
const cloneCertificate = () => forge.pki.certificateFromAsn1(forge.pki.certificateToAsn1(certificate));
const makePfx = (certs, signingKey = key) => Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(signingKey, certs, password, { algorithm: '3des' })).getBytes(), 'binary');
async function pdfBytes() { const doc = await PDFDocument.create(); doc.addPage(); return Buffer.from(await doc.save()); }

test('new PKCS#12 uses authenticated AES-256 PBES2 with explicit hardened derivation parameters', () => {
  const container = forge.asn1.fromDer(original.toString('binary'));
  const authenticatedSafe = forge.asn1.fromDer(container.value[1].value[1].value[0].value);
  const safeBags = authenticatedSafe.value.flatMap(content => forge.asn1.fromDer(content.value[1].value[0].value).value);
  assert.equal(safeBags.some(bag => forge.asn1.derToOid(bag.value[0].value) === forge.pki.oids.keyBag), false);
  const encrypted = safeBags.find(bag => forge.asn1.derToOid(bag.value[0].value) === forge.pki.oids.pkcs8ShroudedKeyBag).value[1].value[0];
  const algorithm = encrypted.value[0];
  assert.equal(forge.asn1.derToOid(algorithm.value[0].value), '1.2.840.113549.1.5.13');
  const [kdf, cipher] = algorithm.value[1].value;
  assert.equal(forge.asn1.derToOid(kdf.value[0].value), '1.2.840.113549.1.5.12');
  assert.equal(forge.asn1.derToInteger(kdf.value[1].value[1].value), 100000);
  assert.equal(kdf.value[1].value[0].value.length, 16);
  assert.equal(forge.asn1.derToOid(kdf.value[1].value.at(-1).value[0].value), '1.2.840.113549.2.9');
  assert.equal(forge.asn1.derToOid(cipher.value[0].value), '2.16.840.1.101.3.4.1.42');
  const mac = container.value[2];
  assert.equal(forge.asn1.derToOid(mac.value[0].value[0].value[0].value), forge.pki.oids.sha1, 'Forge writer provides HMAC-SHA1; do not advertise a different MAC');
  assert.equal(forge.asn1.derToInteger(mac.value[2].value), 100000);
  assert.equal(mac.value[1].value.length, 16);
});

test('legacy 3DES certificates remain readable and usable alongside new AES-256 certificates', async () => {
  const signed = await signer.signPdfBuffer(await pdfBytes(), makePfx(certificate), password, { signerName: 'Legacy compatibility' });
  assert.equal(load('verifier').inspectPdfSignature(signed).status, 'intact');
  const updated = await signer.signPdfBuffer(await pdfBytes(), original, password, { signerName: 'AES compatibility' });
  assert.equal(load('verifier').inspectPdfSignature(updated).status, 'intact');
});

test('rejects ambiguous certificates sharing a key instead of checking one and signing another', async () => {
  const expired = cloneCertificate(); expired.serialNumber = '42';
  expired.validity.notAfter = new Date(Date.now() - 86400000);
  expired.sign(key, forge.md.sha256.create());
  const pdf = await pdfBytes();
  for (const certificates of [[certificate, expired], [expired, certificate]]) {
    await assert.rejects(signer.signPdfBuffer(pdf, makePfx(certificates), password, { signerName: 'Policy' }), /ambiguous|multiple|more than one/i);
  }
});

test('rejects multiple encrypted private-key bags instead of choosing one silently', async () => {
  const container = forge.pkcs12.toPkcs12Asn1(key, certificate, password, { algorithm: '3des', useMac: false });
  const octets = container.value[1].value[1].value[0];
  const authenticatedSafe = forge.asn1.fromDer(octets.value);
  authenticatedSafe.value.push(authenticatedSafe.value.at(-1));
  octets.value = forge.asn1.toDer(authenticatedSafe).getBytes();
  const duplicateKeys = Buffer.from(forge.asn1.toDer(container).getBytes(), 'binary');
  const parsed = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(duplicateKeys.toString('binary')), false, password);
  assert.equal(parsed.safeContents.flatMap(content => content.safeBags).filter(bag => bag.key).length, 2);
  await assert.rejects(signer.signPdfBuffer(await pdfBytes(), duplicateKeys, password, { signerName: 'Policy' }), /ambiguous|multiple|more than one/i);
});

test('honors explicit signing key usage and rejects RSA below 2048 bits', async () => {
  const cert = cloneCertificate();
  cert.setExtensions([{ name: 'keyUsage', digitalSignature: false, nonRepudiation: false, keyEncipherment: true }]);
  cert.sign(key, forge.md.sha256.create());
  const pdf = await pdfBytes();
  await assert.rejects(signer.signPdfBuffer(pdf, makePfx(cert), password, { signerName: 'Policy' }), /usage|signing|signature/i);
  cert.setExtensions([{ name: 'keyUsage', nonRepudiation: true }]); cert.sign(key, forge.md.sha256.create());
  await assert.doesNotReject(signer.signPdfBuffer(pdf, makePfx(cert), password, { signerName: 'Policy' }));
  const weak = forge.pki.rsa.generateKeyPair(1024);
  cert.publicKey = weak.publicKey; cert.sign(weak.privateKey, forge.md.sha256.create());
  await assert.rejects(signer.signPdfBuffer(pdf, makePfx(cert, weak.privateKey), password, { signerName: 'Policy' }), /2048|weak/i);
});

test('certificate summary exposes issuer and SHA-256 fingerprint without claiming trust', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-certificate-policy-'));
  try {
    const file = path.join(dir, 'fixture.pfx'); fs.writeFileSync(file, original);
    const info = signer.getCertificateInfo(file, password);
    assert.equal(info.valid, true); assert.equal(info.commonName, 'Policy fixture');
    assert.match(info.issuer, /CN=Policy fixture/); assert.equal(info.selfSigned, true);
    const der = Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes(), 'binary');
    assert.equal(info.fingerprint, new crypto.X509Certificate(der).fingerprint256);
    assert.equal(Object.hasOwn(info, 'trusted'), false);
    assert.equal(certificate.getExtension('extKeyUsage'), null, 'new document certificates must not be restricted to email/client authentication');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('refuses to return a generated signature when its post-signing integrity check fails', async () => {
  const { P12Signer } = require('@signpdf/signer-p12');
  const originalSign = P12Signer.prototype.sign;
  P12Signer.prototype.sign = async () => Buffer.from('not a CMS signature');
  try {
    await assert.rejects(signer.signPdfBuffer(await pdfBytes(), original, password, { signerName: 'Policy' }), /verif|integrity/i);
  } finally { P12Signer.prototype.sign = originalSign; }
});

test('signing a copy preserves the source and never replaces an existing signed output', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-copy-policy-'));
  try {
    const source = path.join(dir, 'document.pdf'); const cert = path.join(dir, 'certificate.pfx');
    const bytes = await pdfBytes(); fs.writeFileSync(source, bytes); fs.writeFileSync(cert, original);
    const output = await signer.signPdfCopy(source, cert, password, { signerName: 'Policy' });
    assert.equal(output, path.join(dir, 'document.signed.pdf'));
    assert.deepEqual(fs.readFileSync(source), bytes);
    const signed = fs.readFileSync(output);
    assert.equal(load('verifier').inspectPdfSignature(signed).status, 'intact');
    const second = await signer.signPdfCopy(source, cert, password, { signerName: 'Policy' });
    assert.match(path.basename(second), /^document\.signed-[0-9a-f]{8}\.pdf$/);
    assert.deepEqual(fs.readFileSync(output), signed);
    assert.deepEqual(fs.readFileSync(source), bytes);
    assert.equal(load('verifier').inspectPdfSignature(fs.readFileSync(second)).status, 'intact');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a failed copy write cleans only its newly created file and preserves source and existing outputs', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-copy-failure-'));
  const originalOpen = fs.promises.open;
  try {
    const source = path.join(dir, 'document.pdf'); const cert = path.join(dir, 'certificate.pfx');
    const bytes = await pdfBytes(); fs.writeFileSync(source, bytes); fs.writeFileSync(cert, original);
    const existing = path.join(dir, 'document.signed.pdf'); fs.writeFileSync(existing, 'keep this file');
    fs.promises.open = async (...args) => {
      const handle = await originalOpen(...args);
      return { async writeFile() { await handle.writeFile('partial write'); throw new Error('simulated full disk'); }, close: () => handle.close() };
    };
    await assert.rejects(signer.signPdfCopy(source, cert, password, { signerName: 'Policy' }), /full disk/);
    assert.deepEqual(fs.readFileSync(source), bytes);
    assert.equal(fs.readFileSync(existing, 'utf8'), 'keep this file');
    assert.deepEqual(fs.readdirSync(dir).sort(), ['certificate.pfx', 'document.pdf', 'document.signed.pdf']);
  } finally { fs.promises.open = originalOpen; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a source replaced during copy signing is preserved without producing an output', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-copy-change-'));
  const originalRead = fs.promises.readFile;
  try {
    const source = path.join(dir, 'document.pdf'); const cert = path.join(dir, 'certificate.pfx');
    fs.writeFileSync(source, await pdfBytes()); fs.writeFileSync(cert, original);
    let reads = 0;
    fs.promises.readFile = async (file, ...args) => {
      if (file === source && ++reads === 2) fs.writeFileSync(source, 'new source content');
      return originalRead(file, ...args);
    };
    await assert.rejects(signer.signPdfCopy(source, cert, password, { signerName: 'Policy' }), /changed/i);
    assert.equal(fs.readFileSync(source, 'utf8'), 'new source content');
    assert.deepEqual(fs.readdirSync(dir).sort(), ['certificate.pfx', 'document.pdf']);
  } finally { fs.promises.readFile = originalRead; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('rejects oversized certificate buffers before PKCS#12 parsing', async () => {
  const oversized = Buffer.alloc(signer.MAX_CERTIFICATE_BYTES + 1);
  await assert.rejects(signer.signPdfBuffer(Buffer.from('%PDF-1.7'), oversized, password, { signerName: 'Policy' }), /large|limit/i);
});

test('file signing checks PDF and certificate sizes before loading either input', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-size-policy-'));
  const originalStat = fs.promises.stat; const originalRead = fs.promises.readFile;
  try {
    const source = path.join(dir, 'document.pdf'); const cert = path.join(dir, 'certificate.pfx');
    fs.writeFileSync(source, 'small placeholder'); fs.writeFileSync(cert, original);
    let reads = 0;
    fs.promises.readFile = async () => { reads++; throw new Error('input must not be loaded'); };
    for (const oversized of ['pdf', 'certificate']) {
      fs.promises.stat = async file => ({ size: file === source
        ? oversized === 'pdf' ? signer.MAX_SIGNING_PDF_BYTES + 1 : 10
        : oversized === 'certificate' ? signer.MAX_CERTIFICATE_BYTES + 1 : original.length });
      for (const sign of [signer.signPdfFile, signer.signPdfCopy]) {
        await assert.rejects(sign(source, cert, password, { signerName: 'Policy' }), /large|limit/i);
      }
    }
    assert.equal(reads, 0);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['certificate.pfx', 'document.pdf']);
  } finally { fs.promises.stat = originalStat; fs.promises.readFile = originalRead; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('certificate summary checks the file size before reading the PFX', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-cert-size-policy-'));
  const originalStat = fs.statSync; const originalRead = fs.readFileSync;
  try {
    const cert = path.join(dir, 'certificate.pfx'); fs.writeFileSync(cert, original);
    let reads = 0;
    fs.statSync = file => file === cert ? { size: signer.MAX_CERTIFICATE_BYTES + 1 } : originalStat(file);
    fs.readFileSync = (...args) => { if (args[0] === cert) reads++; return originalRead(...args); };
    const info = signer.getCertificateInfo(cert, password);
    assert.equal(info.valid, false); assert.match(info.error, /large|limit/i); assert.equal(reads, 0);
  } finally { fs.statSync = originalStat; fs.readFileSync = originalRead; fs.rmSync(dir, { recursive: true, force: true }); }
});

test('review fingerprint binds signing to approved bytes before certificate parsing or output', async () => {
  const reviewed = await PDFDocument.create(); reviewed.addPage(); reviewed.setTitle('Reviewed A');
  const replacement = await PDFDocument.create(); replacement.addPage(); replacement.setTitle('Replacement B');
  const bytesA = Buffer.from(await reviewed.save()); const bytesB = Buffer.from(await replacement.save());
  const expectedA = crypto.createHash('sha256').update(bytesA).digest('hex');
  const metadata = { signerName: 'Policy', expectedFingerprint: expectedA };
  await assert.rejects(signer.signPdfBuffer(bytesB, Buffer.alloc(0), password, metadata), /changed/i);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-review-fingerprint-'));
  try {
    const source = path.join(dir, 'document.pdf'); const cert = path.join(dir, 'certificate.pfx');
    fs.writeFileSync(source, bytesB); fs.writeFileSync(cert, Buffer.alloc(0));
    for (const sign of [signer.signPdfFile, signer.signPdfCopy]) {
      await assert.rejects(sign(source, cert, password, metadata), /changed/i);
    }
    assert.deepEqual(fs.readFileSync(source), bytesB);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['certificate.pfx', 'document.pdf']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  const signed = await signer.signPdfBuffer(bytesA, original, password, metadata);
  assert.equal(load('verifier').inspectPdfSignature(signed).status, 'intact');
});
