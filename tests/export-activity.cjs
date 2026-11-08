const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { transformSync } = require('esbuild');
function fixture(initial = true, available = true) {
  let throttling = initial, destroyed = false;
  const changes = [];
  const contents = { id: 23, isDestroyed: () => destroyed,
    getBackgroundThrottling: () => throttling,
    setBackgroundThrottling(value) { changes.push(value); throttling = value; } };
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(path.join(__dirname, '../src/export-activity.ts'), 'utf8'), { loader: 'ts', format: 'cjs' }).code;
  const hostRequire = () => {
    if (!available) throw new Error('No Electron remote API');
    return { remote: { getCurrentWebContents: () => contents } };
  };
  vm.runInNewContext(code, { module, exports: module.exports, require: hostRequire, window: { require: hostRequire } });
  return { ...module.exports, changes, enabled: () => throttling, close() { destroyed = true; } };
}
test('native export hands activity to signing without re-suspending the renderer between them', () => {
  const f = fixture();
  const endExport = f.keepExportActive();
  const endSigning = f.keepExportActive();
  assert.deepEqual(f.changes, [false]);
  endExport(); endExport();
  assert.equal(f.enabled(), false);
  endSigning(); endSigning();
  assert.deepEqual(f.changes, [false, true]);
});
test('consecutive exports restore activity, and a failed export releases its lease', () => {
  const f = fixture();
  for (const fails of [false, true]) {
    const release = f.keepExportActive();
    try { if (fails) throw new Error('Native print failed'); }
    catch (error) { assert.equal(error.message, 'Native print failed'); }
    finally { release(); }
  }
  assert.deepEqual(f.changes, [false, true, false, true]);
});
test('an already unthrottled renderer retains its existing setting', () => {
  const f = fixture(false); f.keepExportActive()();
  assert.equal(f.enabled(), false); assert.deepEqual(f.changes, []);
});
test('unloading restores active windows once and stale releases cannot affect later exports', () => {
  const f = fixture(), old = f.keepExportActive();
  f.releaseExportActivity();
  const current = f.keepExportActive(); old();
  assert.equal(f.enabled(), false); current();
  assert.deepEqual(f.changes, [false, true, false, true]);
});
test('closed windows and unavailable host APIs leave cleanup safe', () => {
  const f = fixture(), release = f.keepExportActive(); f.close();
  assert.doesNotThrow(release); assert.deepEqual(f.changes, [false]);
  assert.doesNotThrow(fixture(true, false).keepExportActive());
});
