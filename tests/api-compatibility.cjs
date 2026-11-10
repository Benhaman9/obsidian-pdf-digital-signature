const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { checkCompatibility } = require('../scripts/check-api-compatibility.cjs');
const root = path.resolve(__dirname, '..');

test('all referenced Obsidian APIs fit the published manifest and release metadata', () => {
  const result = checkCompatibility(root);
  assert.ok(result.checked > 0);
  assert.deepEqual(result.findings, []);
  const manifest = require('../manifest.json');
  assert.equal(require('../package.json').version, manifest.version);
  assert.equal(require('../package-lock.json').packages[''].version, manifest.version);
  assert.equal(require('../versions.json')[manifest.version], manifest.minAppVersion);
});

test('a feature guard and ESLint suppression cannot hide newer inherited or aliased APIs', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-sig-api-'));
  try {
    fs.mkdirSync(path.join(fixture, 'node_modules/obsidian'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'node_modules/obsidian/index.d.ts'), `
      export class PluginSettingTab {
        /** @since 1.13.0 */
        update(): void;
      }
      /** @since 1.14.0 */ export function newApi(): void;
    `);
    fs.writeFileSync(path.join(fixture, 'manifest.json'), JSON.stringify({ minAppVersion: '1.11.5' }));
    fs.writeFileSync(path.join(fixture, 'tsconfig.json'), JSON.stringify({ compilerOptions: { moduleResolution: 'node' }, include: ['src.ts'] }));
    fs.writeFileSync(path.join(fixture, 'src.ts'), `
      import { PluginSettingTab, newApi as renamed } from 'obsidian';
      class Settings extends PluginSettingTab {
        refresh() {
          // eslint-disable-next-line obsidianmd/no-unsupported-api
          if (typeof this.update === 'function') this.update();
          renamed();
        }
      }
    `);
    const result = checkCompatibility(fixture);
    assert.ok(result.findings.some(item => item.api === 'update' && item.since === '1.13.0'));
    assert.ok(result.findings.some(item => item.api === 'newApi' && item.since === '1.14.0'));
  } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
});

test('the rejected 1.2.4 minimum is refused for the declarative settings APIs', () => {
  const result = checkCompatibility(root, '1.11.5');
  assert.ok(result.findings.some(item => item.api === 'update' && item.since === '1.13.0'));
});
