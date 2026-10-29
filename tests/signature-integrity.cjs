const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const forge = require('node-forge');
const { PDFDocument, PDFName, PDFDict, PDFArray, PDFNumber } = require('pdf-lib');
const { transformSync } = require('esbuild');

const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} }; modules.set(name, module);
  const code = transformSync(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2020' }).code;
  vm.runInNewContext(code, {
    module, exports: module.exports, Buffer, console,
    require(id) { return id === 'obsidian' ? { getLanguage: () => 'en' } : id.startsWith('./') ? load(id.slice(2)) : require(id); },
  }, { filename: name + '.ts' });
  return module.exports;
}
const signer = load('signer');

// Check the covered bytes and the authenticated attributes separately: an intact
// signature over an earlier revision is not a signature over the latest file.
function inspectCMS(bytes) {
  const ranges = bytes.toString('latin1').match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/).slice(1).map(Number);
  const content = Buffer.concat([bytes.subarray(ranges[0], ranges[0] + ranges[1]), bytes.subarray(ranges[2], ranges[2] + ranges[3])]);
  const hex = bytes.subarray(ranges[1] + 1, ranges[2] - 1).toString('ascii');
  const cms = forge.asn1.fromDer(Buffer.from(hex, 'hex').toString('binary'), { parseAllBytes: false });
  const signedData = cms.value[1].value[0];
  const signerInfo = signedData.value.at(-1).value[0];
  const attributes = signerInfo.value[3];
  const digestAttr = attributes.value.find(attr => forge.asn1.derToOid(attr.value[0].value) === forge.pki.oids.messageDigest);
  const certs = signedData.value.find(item => item.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC && item.type === 0);
  const certificate = forge.pki.certificateFromAsn1(certs.value[0]);
  const signedAttributes = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attributes.value);
  return {
    digestMatches: Buffer.from(digestAttr.value[1].value[0].value, 'binary').equals(crypto.createHash('sha256').update(content).digest()),
    authenticatedAttributesValid: crypto.verify('sha256', Buffer.from(forge.asn1.toDer(signedAttributes).getBytes(), 'binary'), forge.pki.publicKeyToPem(certificate.publicKey), Buffer.from(signerInfo.value[5].value, 'binary')),
    coversCurrentFile: ranges[0] === 0 && ranges[2] + ranges[3] === bytes.length,
  };
}

async function certificationPermission(bytes) {
  const pdf = await PDFDocument.load(bytes);
  const perms = pdf.catalog.lookupMaybe(PDFName.of('Perms'), PDFDict);
  if (!perms) return undefined;
  const signature = perms.lookup(PDFName.of('DocMDP'), PDFDict);
  const references = signature.lookup(PDFName.of('Reference'), PDFArray);
  const transform = references.asArray().map(ref => pdf.context.lookup(ref, PDFDict))
    .find(dict => dict.lookup(PDFName.of('TransformMethod'), PDFName).toString() === '/DocMDP');
  const parameters = transform.lookup(PDFName.of('TransformParams'), PDFDict);
  return parameters.lookup(PDFName.of('P'), PDFNumber).asNumber();
}

// Make an actual PDF incremental revision that changes the page rotation, as
// PDF editors can do, without overwriting any byte from the signed revision.
async function appendChangedRevision(bytes) {
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages()[0];
  page.node.set(PDFName.of('Rotate'), PDFNumber.of(90));
  const previousXref = Number([...bytes.toString('latin1').matchAll(/startxref\s+(\d+)/g)].at(-1)[1]);
  const objectOffset = bytes.length + 1;
  const object = `${page.ref.objectNumber} ${page.ref.generationNumber} obj\n${page.node.toString()}\nendobj\n`;
  const xrefOffset = objectOffset + Buffer.byteLength(object);
  const suffix = `\n${object}xref\n${page.ref.objectNumber} 1\n${String(objectOffset).padStart(10, '0')} ${String(page.ref.generationNumber).padStart(5, '0')} n \ntrailer\n<< /Size ${pdf.context.largestObjectNumber + 1} /Root ${pdf.context.trailerInfo.Root.toString()} /Prev ${previousXref} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.concat([bytes, Buffer.from(suffix)]);
}

test('certification signs the entire revision, and signed-byte changes break integrity', async () => {
  const certificate = signer.createSelfSignedCertificate('Integrity test', 'temporary-test-password');
  const pdf = await PDFDocument.create(); pdf.addPage();
  const signed = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'temporary-test-password', { signerName: 'Integrity test' });
  assert.deepEqual(inspectCMS(signed), { digestMatches: true, authenticatedAttributesValid: true, coversCurrentFile: true });
  assert.equal(await certificationPermission(signed), 1, 'default certification permits no changes');
  const changed = Buffer.from(signed);
  const version = changed.indexOf(Buffer.from('%PDF-1.')) + 7;
  changed[version] = changed[version] === 55 ? 54 : 55;
  assert.equal(inspectCMS(changed).digestMatches, false);
  assert.equal(inspectCMS(changed).authenticatedAttributesValid, true, 'RSA attributes alone do not verify document integrity');
});

test('an appended page change preserves the old CMS but is outside its coverage and forbidden by DocMDP', async () => {
  const certificate = signer.createSelfSignedCertificate('Revision test', 'temporary-test-password');
  const pdf = await PDFDocument.create(); pdf.addPage();
  const signed = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'temporary-test-password', { signerName: 'Revision test', signatureMode: 'certify' });
  const updated = await appendChangedRevision(signed);
  assert.equal((await PDFDocument.load(updated)).getPages()[0].getRotation().angle, 90, 'the latest revision must actually change the document');
  assert.deepEqual(inspectCMS(updated), { digestMatches: true, authenticatedAttributesValid: true, coversCurrentFile: false });
  assert.equal(await certificationPermission(updated), 1);
});

test('approval mode is explicitly selectable and carries no certification permissions', async () => {
  const certificate = signer.createSelfSignedCertificate('Approval test', 'temporary-test-password');
  const pdf = await PDFDocument.create(); pdf.addPage();
  const signed = await signer.signPdfBuffer(Buffer.from(await pdf.save()), certificate, 'temporary-test-password', { signerName: 'Approval test', signatureMode: 'approval' });
  assert.equal(await certificationPermission(signed), undefined);
  assert.deepEqual(inspectCMS(signed), { digestMatches: true, authenticatedAttributesValid: true, coversCurrentFile: true });
});
