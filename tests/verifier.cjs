const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const { PDFDocument } = require('pdf-lib');
const forge = require('node-forge');
const { performance } = require('node:perf_hooks');
const independent = require('./fixtures/pyhanko-independent.json');
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} }; modules.set(name, module);
  const source = fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8');
  vm.runInNewContext(transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2020' }).code, {
    module, exports: module.exports, Buffer, console,
    require(id) { return id === 'obsidian' ? { getLanguage: () => 'en' } : id.startsWith('./') ? load(id.slice(2)) : require(id); },
  });
  return module.exports;
}
const { inspectPdfSignature } = load('verifier');
const signer = load('signer');
function assertUnverified(result) {
  assert.equal(result.scope, 'local-integrity');
  assert.equal(result.certificateTrust, 'not-checked');
  assert.equal(result.revocationStatus, 'not-checked');
  assert.equal(result.timestampStatus, 'not-checked');
}
const fixture = (async () => {
  const certificate = signer.createSelfSignedCertificate('Integrity fixture', 'test-password');
  const pdf = await PDFDocument.create(); pdf.addPage();
  pdf.setTitle('ORIGINAL-TITLE');
  return signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'test-password', { signerName: 'Integrity fixture' });
})();

test('local verifier corroborates intact RSA SHA-256 signature without asserting trust', async () => {
  const result = inspectPdfSignature(await fixture);
  assert.equal(result.status, 'intact', JSON.stringify(result));
  assertUnverified(result);
  assert.equal(result.signatureSyntax, 'supported');
  assert.equal(result.signedRevisionIntegrity, 'valid');
  assert.equal(result.currentFileCoverage, 'entire-file');
  assert.match(result.signer, /Integrity fixture/);
  assert.equal(result.certificateValidNow, true);
  assert.equal(result.cryptographicIntegrity, true);
  assert.equal(result.selfSigned, true);
  assert.match(result.certificateFingerprint, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
  assert.equal(result.certificateIssuer, result.signer);
  assert.equal(result.appendedBytes, 0);
  assert.equal(result.detail, 'integrity-only-trust-not-checked');
});

test('local verifier detects changed signed bytes and appended revisions', async () => {
  const original = await fixture;
  const changed = Buffer.from(original);
  changed[20] ^= 1;
  assert.equal(inspectPdfSignature(changed).status, 'modified');
  assert.equal(inspectPdfSignature(changed).cryptographicIntegrity, false);
  assert.equal(inspectPdfSignature(changed).signedRevisionIntegrity, 'invalid');
  const appended = Buffer.concat([original, Buffer.from('\n% later revision\n')]);
  const result = inspectPdfSignature(appended);
  assert.equal(result.status, 'modified');
  assert.equal(result.cryptographicIntegrity, true);
  assertUnverified(result);
  assert.equal(result.signedRevisionIntegrity, 'valid');
  assert.equal(result.currentFileCoverage, 'signed-revision-only');
  assert.equal(result.appendedBytes, appended.length - original.length);
  assert.equal(result.detail, 'bytes-after-signed-revision');
  const range = original.toString('latin1').match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
  const raw = Buffer.from(original.subarray(range[1] + 1, range[2] - 1).toString('ascii'), 'hex');
  const cms = forge.asn1.fromDer(raw.toString('binary'), { parseAllBytes: false });
  const signature = Buffer.from(cms.value[1].value[0].value.at(-1).value[0].value[5].value, 'binary');
  const signatureOffset = raw.indexOf(signature);
  assert.ok(signatureOffset >= 0);
  raw[signatureOffset] ^= 1;
  const brokenSignature = Buffer.from(original);
  brokenSignature.write(raw.toString('hex'), range[1] + 1, 'ascii');
  assert.equal(inspectPdfSignature(brokenSignature).status, 'modified');
});

test('local verifier refuses ambiguous ranges, excluded non-Contents bytes and unsupported algorithms', async () => {
  const original = await fixture;
  const text = original.toString('latin1');
  assert.equal(inspectPdfSignature(Buffer.concat([original, Buffer.from('\n/ByteRange [0 1 2 3]')])).status, 'unsupported');
  assert.equal(inspectPdfSignature(Buffer.from(text.replace('/Contents', '/Xontents'), 'latin1')).status, 'unsupported');
  assert.equal(inspectPdfSignature(Buffer.from(text.replace('adbe.pkcs7.detached', 'ETSI.CAdES.detached'), 'latin1')).status, 'unsupported');
  assert.equal(inspectPdfSignature(Buffer.from(text.replace(/\/ByteRange\s*\[\s*0/, '/ByteRange [ 1'), 'latin1')).status, 'unsupported');
  const range = text.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
  const badPadding = Buffer.from(original);
  badPadding[range[2] - 2] = 0x31;
  assert.equal(inspectPdfSignature(badPadding).status, 'unsupported');
});

test('signature metadata containing PDF keys, object markers and escaped nested parentheses stays verifiable', async () => {
  const certificate = signer.createSelfSignedCertificate('Lexical fixture', 'test-password');
  for (const value of ['Normal /Contents text', 'Normal /ByteRange text', 'Normal /SubFilter text', 'Normal (nested (parentheses)) endobj text', 'Normal \\(escaped\\) obj endobj % comment text']) {
    const pdf = await PDFDocument.create(); pdf.addPage();
    const bytes = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'test-password', {
      signerName: value, reason: value, location: value,
    });
    const result = inspectPdfSignature(bytes);
    assert.equal(result.status, 'intact', value + ': ' + JSON.stringify(result));
    assert.equal(result.cryptographicIntegrity, true);
  }
});

test('PDF content streams and comments cannot masquerade as signature dictionary keys', async () => {
  const certificate = signer.createSelfSignedCertificate('Stream fixture', 'test-password');
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  page.drawText('A real page with compressed content.');
  const comment = pdf.context.stream(Buffer.from('% /Contents /ByteRange [0 1 2 3] /SubFilter endobj ( unmatched\n'));
  page.node.addContentStream(pdf.context.register(comment));
  const bytes = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'test-password', { signerName: 'Stream fixture' });
  assert.equal(inspectPdfSignature(bytes).status, 'intact');
  const appendedComment = Buffer.concat([bytes, Buffer.from('\n% /Contents /ByteRange [0 1 2 3] endobj\n')]);
  const report = inspectPdfSignature(appendedComment);
  assert.equal(report.status, 'modified');
  assert.equal(report.cryptographicIntegrity, true);
});

test('local verifier distinguishes unsigned input and malformed signature dictionaries', async () => {
  const pdf = await PDFDocument.create(); pdf.addPage();
  assert.equal(inspectPdfSignature(Buffer.from(await pdf.save({ useObjectStreams: false }))).status, 'unsigned');
  assert.equal(inspectPdfSignature(Buffer.from(await pdf.save())).status, 'unsupported');
  assert.equal(inspectPdfSignature(Buffer.from('/Type /Sig')).status, 'unsupported');
  assert.equal(inspectPdfSignature(Buffer.from('/ByteRange [-1 2 3 4]')).status, 'unsupported');
  for (const bytes of [Buffer.from('/Type /Sig'), Buffer.from(await pdf.save()), Buffer.from(await pdf.save({ useObjectStreams: false }))]) {
    const result = inspectPdfSignature(bytes);
    assertUnverified(result);
    assert.equal(result.signedRevisionIntegrity, 'unknown');
    assert.equal(result.currentFileCoverage, 'unknown');
    assert.equal(result.cryptographicIntegrity, undefined);
  }
});

test('independent pyHanko RSA SHA-256 detached fixture verifies locally; two signatures stay explicitly unsupported', () => {
  assert.match(independent.generator, /^pyHanko /);
  assert.equal(independent.networkFetching, false);
  const single = independent.fixtures.find(row => row.name === 'single-adbe-rsa-sha256');
  const double = independent.fixtures.find(row => row.name === 'double-adbe-rsa-sha256');
  assert.equal(single.validation.length, 1);
  assert.equal(double.validation.length, 2);
  assert.ok([...single.validation, ...double.validation].every(row => row.valid && row.intact));
  const one = inspectPdfSignature(Buffer.from(single.pdfBase64, 'base64'));
  assert.equal(one.status, 'intact', JSON.stringify(one));
  assertUnverified(one);
  assert.equal(one.signedRevisionIntegrity, 'valid');
  const two = inspectPdfSignature(Buffer.from(double.pdfBase64, 'base64'));
  assert.equal(two.status, 'unsupported');
  assertUnverified(two);
  assert.equal(two.signatureSyntax, 'unsupported');
  assert.equal(two.signedRevisionIntegrity, 'unknown');
  assert.equal(two.currentFileCoverage, 'unknown');
  assert.equal(two.cryptographicIntegrity, undefined);
});

test('local integrity check handles a small 300-page PDF with bounded input', async (context) => {
  const pdf = await PDFDocument.create();
  for (let index = 1; index <= 300; index++) {
    const page = pdf.addPage();
    page.drawText('Synthetic document page ' + index);
  }
  const certificate = signer.createSelfSignedCertificate('300-page synthetic fixture', 'test-password');
  const bytes = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'test-password', { signerName: '300-page synthetic fixture' });
  assert.ok(bytes.length < 1024 * 1024, 'Small input fixture, not a large-file benchmark');
  const before = process.memoryUsage();
  const start = performance.now();
  const result = inspectPdfSignature(bytes);
  const elapsed = performance.now() - start;
  const after = process.memoryUsage();
  assert.equal(result.status, 'intact', JSON.stringify(result));
  assertUnverified(result);
  assert.equal(result.currentFileCoverage, 'entire-file');
  context.diagnostic(JSON.stringify({ pages: 300, bytes: bytes.length, verificationMilliseconds: Math.round(elapsed * 100) / 100,
    heapDeltaBytes: after.heapUsed - before.heapUsed, rssDeltaBytes: after.rss - before.rss,
    measurement: 'One local run including GC effects; no performance guarantee.' }));
});
