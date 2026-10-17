const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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
