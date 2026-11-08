const { test } = require('node:test');
const assert = require('node:assert/strict');
const forge = require('node-forge');

test('PKCS#12 key derivation refuses a zero iteration count instead of deriving a password-independent key', () => {
  assert.throws(() => forge.pkcs12.generateKey('test', 'test-salt', 3, 0, 20, forge.md.sha1.create()), /iteration count must be >= 1/i);
});
