const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVersion, compareVersions } = require('../src/updater');

test('parseVersion accepts vX.Y.Z and X.Y.Z forms', () => {
  assert.deepEqual(parseVersion('v0.2.10'), [0, 2, 10]);
  assert.deepEqual(parseVersion('0.2.10'), [0, 2, 10]);
  assert.deepEqual(parseVersion('V1.0.0'), [1, 0, 0]);
});

test('parseVersion strips pre-release/build metadata', () => {
  assert.deepEqual(parseVersion('v1.2.3-beta.1'), [1, 2, 3]);
  assert.deepEqual(parseVersion('1.2.3+build.5'), [1, 2, 3]);
});

test('parseVersion returns null for malformed tags', () => {
  assert.equal(parseVersion(''), null);
  assert.equal(parseVersion('not-a-version'), null);
  assert.equal(parseVersion('1.2'), null);
  assert.equal(parseVersion(null), null);
  assert.equal(parseVersion(undefined), null);
});

test('compareVersions ranks versions correctly', () => {
  assert.ok(compareVersions([0, 2, 10], [0, 2, 9]) > 0);
  assert.ok(compareVersions([0, 2, 10], [0, 2, 11]) < 0);
  assert.equal(compareVersions([0, 2, 10], [0, 2, 10]), 0);
  assert.ok(compareVersions([1, 0, 0], [0, 99, 99]) > 0);
  // 0.2.10 must outrank 0.2.9 numerically (string sort would lie).
  assert.ok(compareVersions(parseVersion('v0.2.10'), parseVersion('v0.2.9')) > 0);
});
