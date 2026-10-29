const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

function load(overrides = {}, fakeProcess = process) {
  const module = { exports: {} };
  const code = transformSync(fs.readFileSync(path.join(__dirname, '../src/certificate-location.ts'), 'utf8'), { loader: 'ts', format: 'cjs', target: 'es2020' }).code;
  vm.runInNewContext(code, { module, exports: module.exports, process: fakeProcess,
    require(id) { return Object.hasOwn(overrides, id) ? overrides[id] : require(id); },
  });
  return module.exports;
}
const location = load();

test('classifies paths on directory boundaries without creating missing files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'certificate-location-'));
  try {
    const vault = path.join(dir, 'vault'); fs.mkdirSync(vault);
    assert.equal(location.certificateLocation(vault, 'keys/new.pfx'), 'inside');
    assert.equal(location.certificateLocation(vault, vault), 'inside');
    assert.equal(location.certificateLocation(vault, path.join(dir, 'vault-neighbor/keys/new.pfx')), 'outside');
    assert.equal(location.certificateLocation(vault, '../outside.pfx'), 'outside');
    assert.deepEqual(fs.readdirSync(dir), ['vault']);
    assert.equal(location.certificateLocation('', 'file.pfx'), 'unknown');
    assert.equal(location.certificateLocation(vault, '\0'), 'unknown');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('resolves existing junctions and missing descendants before declaring a key outside', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'certificate-links-'));
  try {
    const vault = path.join(dir, 'vault'); fs.mkdirSync(vault);
    const alias = path.join(dir, 'outside-alias');
    fs.symlinkSync(vault, alias, process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(location.certificateLocation(vault, path.join(alias, 'missing/subdir/key.pfx')), 'inside');
    assert.equal(location.certificateLocation(alias, path.join(vault, 'new.pfx')), 'inside');
    const outside = path.join(dir, 'outside'); fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(vault, 'linked-outside'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(location.certificateLocation(vault, 'linked-outside/new.pfx'), 'inside', 'lexical membership remains a conservative warning');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('resolution errors and broken links never become an outside assurance', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'certificate-unknown-'));
  try {
    const vault = path.join(dir, 'vault'); fs.mkdirSync(vault);
    const broken = path.join(dir, 'broken');
    fs.symlinkSync(path.join(dir, 'missing-target'), broken, process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal(location.certificateLocation(vault, path.join(broken, 'key.pfx')), 'unknown');
    const denied = load({ fs: { ...fs, realpathSync() { const error = new Error('denied'); error.code = 'EACCES'; throw error; } } });
    assert.equal(denied.certificateLocation(vault, path.join(dir, 'key.pfx')), 'unknown');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('defaults use platform local data and separate vaults without touching disk', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    const paths = platform === 'win32' ? path.win32 : path.posix;
    const home = platform === 'win32' ? 'C:\\Users\\example' : '/home/example';
    const vault = platform === 'win32' ? 'C:\\vaults\\one' : '/vaults/one';
    const base = platform === 'win32' ? 'C:\\LocalData' : '/local/data';
    const helpers = load({ path: paths, os: { homedir: () => home }, fs: { realpathSync: value => value } },
      { platform, env: { LOCALAPPDATA: base, XDG_DATA_HOME: base } });
    const first = helpers.defaultCertificatePath(vault);
    assert.equal(paths.basename(first), 'certificate.pfx');
    assert.match(paths.basename(paths.dirname(first)), /^[0-9a-f]{64}$/);
    assert.ok(first.startsWith(platform === 'darwin' ? paths.join(home, 'Library', 'Application Support') : base));
    assert.equal(helpers.certificateLocation(vault, first), 'outside');
    assert.equal(helpers.defaultCertificatePath(vault), first);
    assert.notEqual(helpers.defaultCertificatePath(paths.join(paths.dirname(vault), 'two')), first);
  }
});

test('defaults avoid a data directory configured inside the vault and fail closed without an outside option', () => {
  const helpers = load({ path: path.posix, os: { homedir: () => '/home/example' }, fs: { realpathSync: value => value } },
    { platform: 'linux', env: { XDG_DATA_HOME: '/vault/keys' } });
  assert.ok(helpers.defaultCertificatePath('/vault').startsWith('/home/example/.local/share/'));
  assert.throws(() => helpers.defaultCertificatePath('/'), /outside/);
});
