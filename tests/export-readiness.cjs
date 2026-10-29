const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { PDFDocument } = require('pdf-lib');
const { transformSync } = require('esbuild');
const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name).exports;
  const module = { exports: {} }; modules.set(name, module);
  const source = fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8');
  const code = transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2020' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, console, setTimeout, clearTimeout,
    require(id) { return id.startsWith('./') ? load(id.slice(2)) : require(id); },
  });
  return module.exports;
}
const { waitForExport } = load('export-readiness');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fast = { timeoutMs: 500, pollMs: 5, stableChecks: 3 };
const hasCode = code => error => error.code === code;
async function temporary(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-export-ready-'));
  try { await run(path.join(dir, 'export.pdf')); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
async function pdfBytes() {
  const pdf = await PDFDocument.create(); pdf.addPage();
  return Buffer.from(await pdf.save());
}

test('waits through a partial write, then validates an object-stream PDF and returns its stable SHA-256', async () => {
  await temporary(async filename => {
    const pdf = await pdfBytes();
    fs.writeFileSync(filename, pdf.subarray(0, 24));
    const phases = [];
    const complete = setTimeout(() => fs.appendFileSync(filename, pdf.subarray(24)), 35);
    try {
      const fingerprint = await waitForExport(filename, { ...fast, onPhase: phase => phases.push(phase) });
      assert.equal(fingerprint, hash(pdf));
      assert.deepEqual(phases, ['waiting', 'validating']);
    } finally { clearTimeout(complete); }
  });
});

test('missing files and permanently empty exports stop at a bounded deadline', async () => {
  await temporary(async filename => {
    await assert.rejects(waitForExport(filename, { ...fast, timeoutMs: 60 }), hasCode('EXPORT_TIMEOUT'));
    fs.writeFileSync(filename, '');
    await assert.rejects(waitForExport(filename, { ...fast, timeoutMs: 60 }), hasCode('EXPORT_TIMEOUT'));
  });
});

test('a stable file with an EOF marker and invalid xref is never accepted as a complete PDF', async () => {
  await temporary(async filename => {
    fs.writeFileSync(filename, '%PDF-1.7\nnot a PDF object tree\nstartxref\n0\n%%EOF\n');
    await assert.rejects(waitForExport(filename, { ...fast, timeoutMs: 60 }), hasCode('EXPORT_INVALID'));
  });
});

test('a replacement cannot advance a caller-supplied fingerprint', async () => {
  await temporary(async filename => {
    const original = await pdfBytes();
    const replacement = Buffer.concat([original, Buffer.from('\n')]);
    fs.writeFileSync(filename, replacement);
    await assert.rejects(waitForExport(filename, { ...fast, expectedFingerprint: hash(original) }), hasCode('EXPORT_CHANGED'));
    assert.deepEqual(fs.readFileSync(filename), replacement);
  });
});

test('detects file changes during validation before returning readiness', async () => {
  await temporary(async filename => {
    const pdf = await pdfBytes(); fs.writeFileSync(filename, pdf);
    await assert.rejects(waitForExport(filename, { ...fast, onPhase: phase => {
      if (phase === 'validating') fs.writeFileSync(filename, Buffer.concat([pdf, Buffer.from('\n')]));
    } }), hasCode('EXPORT_CHANGED'));
  });
});

test('abort interrupts waiting and an already-aborted request never starts filesystem work', async () => {
  await temporary(async filename => {
    const controller = new AbortController();
    const job = waitForExport(filename, { timeoutMs: 1000, pollMs: 1000, signal: controller.signal });
    controller.abort();
    await assert.rejects(job, hasCode('EXPORT_ABORTED'));
    await assert.rejects(waitForExport(filename, { signal: controller.signal }), hasCode('EXPORT_ABORTED'));
  });
});

test('oversized PDFs are rejected from metadata without loading their contents', async () => {
  await temporary(async filename => {
    fs.writeFileSync(filename, ''); fs.truncateSync(filename, 64 * 1024 * 1024 + 1);
    await assert.rejects(waitForExport(filename, fast), hasCode('EXPORT_TOO_LARGE'));
  });
});


test('readiness deadlines use Node timers even when browser timers are unavailable or suspended', async () => {
  const module={exports:{}};
  const code=transformSync(fs.readFileSync(path.join(__dirname,'../src/export-readiness.ts'),'utf8'),{loader:'ts',format:'cjs',target:'es2020'}).code;
  vm.runInNewContext(code,{module,exports:module.exports,Buffer,console,
    setTimeout(){throw new Error('browser timer must not be used');},clearTimeout(){throw new Error('browser timer must not be used');},
    require(id){return id.startsWith('./')?load(id.slice(2)):require(id);}
  });
  await temporary(async filename=>assert.rejects(module.exports.waitForExport(filename,{timeoutMs:60,pollMs:5}),hasCode('EXPORT_TIMEOUT')));
});
