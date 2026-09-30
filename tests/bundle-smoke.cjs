const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('production bundle loads and uses French defaults without altering saved settings', async () => {
  const module = { exports: {} };
  const mock = {
    Plugin: class {}, PluginSettingTab: class {}, SuggestModal: class {}, Modal: class {},
    getLanguage: () => 'fr',
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8'), {
    module, exports: module.exports, Buffer, console, process, global, setTimeout, clearTimeout,
    require: (id) => id === 'obsidian' ? mock : require(id),
  });
  const plugin = new module.exports.default();
  plugin.loadData = async () => ({ certPassword: 'existing', firmarCriptograficamente: true });
  plugin.saveData = async () => {};
  await plugin.loadSettings();
  assert.equal(plugin.settings.nombreFirmante, 'Nom du signataire');
  assert.equal(plugin.settings.certPassword, 'existing');
});
