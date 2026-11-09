const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { transformSync } = require('esbuild');
function fixture() {
  const modules = new Map();
  const calls = [];
  class Setting { constructor(container) { this.container = container; } setName(value) { this.name = value; return this; } setDesc(value) { this.desc = value; return this; } }
  function load(name) {
    if (modules.has(name)) return modules.get(name).exports;
    const module = { exports: {} }; modules.set(name, module);
    const code = transformSync(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), { loader: 'ts', format: 'cjs' }).code;
    vm.runInNewContext(code, { module, exports: module.exports, console, Buffer, require(id) {
      if (id === 'obsidian') return { PluginSettingTab: class {}, Setting, Notice: class {}, getLanguage: () => 'en' };
      if (id === './signer') return { getCertificateInfo() { throw new Error('Search indexing must not parse certificates'); } };
      return id.startsWith('./') ? load(id.slice(2)) : require(id);
    } });
    return module.exports;
  }
  const settings = load('settings'), i18n = load('i18n');
  const plugin = { settings: { ...settings.DEFAULT_SETTINGS, certPassword: 'private-value' },
    async setCertificatePassword(value) { calls.push(['secret', value]); },
    async saveSettings() { calls.push(['save']); } };
  const tab = new settings.PdfSignatureSettingTab({}, plugin);
  return { tab, plugin, calls, t: i18n.t };
}
test('settings search gets every interactive setting without DOM work or parsing a private certificate', () => {
  const { tab, t } = fixture();
  const definitions = tab.getSettingDefinitions();
  for (const key of ['settings_default_toggle_name', 'settings_signature_mode_name', 'settings_cert_path_name', 'settings_cert_password_name', 'settings_btn_generate']) {
    assert.ok(definitions.some(row => row.name === t(key)), key);
  }
  assert.ok(definitions.every(row => typeof row.render === 'function'));
});
test('the searchable password setting uses SecretStorage handler rather than automatic data.json persistence', async () => {
  const { tab, calls, t } = fixture();
  const row = tab.getSettingDefinitions().find(row => row.name === t('settings_cert_password_name'));
  assert.equal(row.control, undefined);
  let onChange;
  const control = { inputEl: {}, setValue() { return this; }, onChange(callback) { onChange = callback; return this; } };
  row.render({ addText(callback) { callback(control); return this; } });
  assert.equal(control.inputEl.type, 'password');
  await onChange('new-private-value');
  assert.deepEqual(calls, [['secret', 'new-private-value']]);
});
test('the older Obsidian display fallback renders the same definitions', () => {
  const { tab } = fixture(); let rendered = false, emptied = false;
  tab.containerEl = { empty() { emptied = true; } };
  tab.getSettingDefinitions = () => [{ name: 'Compatible row', desc: 'Legacy description', render(setting) {
    assert.equal(setting.name, 'Compatible row'); assert.equal(setting.desc, 'Legacy description'); rendered = true;
  } }];
  tab.display(); assert.equal(emptied, true); assert.equal(rendered, true);
});

test('searchable settings have unique names, including the certificate heading and status', () => {
  const { tab } = fixture();
  const names = tab.getSettingDefinitions().map(row => row.name);
  assert.equal(new Set(names).size, names.length);
});
