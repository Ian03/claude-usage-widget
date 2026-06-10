const test = require('node:test');
const assert = require('node:assert/strict');
const { deepMerge, DEFAULTS } = require('../src/config');

test('deepMerge returns a clone of base when override is undefined', () => {
  const base = { a: 1, nested: { b: 2 } };
  const merged = deepMerge(base, undefined);
  assert.deepEqual(merged, base);
  // Mutating the clone must not affect the original.
  merged.nested.b = 999;
  assert.equal(base.nested.b, 2);
});

test('deepMerge replaces primitives at any depth', () => {
  const base = { theme: 'dark', thresholds: { warn: 75, critical: 90 } };
  const patch = { thresholds: { warn: 60 } };
  const merged = deepMerge(base, patch);
  assert.equal(merged.thresholds.warn, 60);
  assert.equal(merged.thresholds.critical, 90, 'unspecified keys keep base value');
  assert.equal(merged.theme, 'dark');
});

test('deepMerge replaces arrays wholesale (not element-by-element)', () => {
  // Important: deep-merging arrays element-by-element would mis-handle a
  // list-of-strings setting where the user removed the last entry — half-
  // applying that would leave the deleted entry in place.
  const base = { tags: ['ok', 'warn', 'critical'] };
  const patch = { tags: ['only-this'] };
  assert.deepEqual(deepMerge(base, patch).tags, ['only-this']);
});

test('deepMerge accepts new keys from the override that base does not have', () => {
  const base = { theme: 'dark' };
  const patch = { newKey: 'newValue', nested: { added: true } };
  const merged = deepMerge(base, patch);
  assert.equal(merged.newKey, 'newValue');
  assert.deepEqual(merged.nested, { added: true });
});

test('deepMerge treats explicit null as a value (not "remove")', () => {
  const base = { position: { x: 100, y: 200 } };
  const patch = { position: null };
  assert.equal(deepMerge(base, patch).position, null);
});

test('deepMerge does not mutate either input', () => {
  const base = { theme: 'dark', thresholds: { warn: 75 } };
  const patch = { thresholds: { warn: 60 } };
  const baseSnapshot = JSON.parse(JSON.stringify(base));
  const patchSnapshot = JSON.parse(JSON.stringify(patch));
  deepMerge(base, patch);
  assert.deepEqual(base, baseSnapshot);
  assert.deepEqual(patch, patchSnapshot);
});

test('deepMerge preserves DEFAULTS shape — every required key still resolves to a value', () => {
  // Sanity guard: if someone trims DEFAULTS without trimming a consumer, this
  // surfaces it. We don't enumerate every key; we just spot-check the load-
  // bearing ones that other modules read.
  const merged = deepMerge(DEFAULTS, {});
  const required = ['theme', 'layout', 'size', 'thresholds', 'colors', 'accentColor', 'checkForUpdates'];
  for (const k of required) {
    assert.ok(k in merged, `DEFAULTS should expose ${k}`);
  }
  assert.equal(typeof merged.thresholds.warn, 'number');
  assert.equal(typeof merged.thresholds.critical, 'number');
});

test('deepMerge accepts deeply nested patches without flattening', () => {
  // Mirrors a real "tweak one reset hook" patch from the settings panel.
  const base = {
    onReset: { five_hour: '', seven_day: '', seven_day_sonnet: '', seven_day_opus: '' },
  };
  const patch = { onReset: { seven_day_sonnet: 'powershell -c notify' } };
  const merged = deepMerge(base, patch);
  assert.equal(merged.onReset.seven_day_sonnet, 'powershell -c notify');
  assert.equal(merged.onReset.five_hour, '', 'sibling keys must remain untouched');
  assert.equal(merged.onReset.seven_day, '');
});

test('DEFAULTS does not include the removed pollOverrides block', () => {
  // Regression guard for the v0.2.13 cleanup that removed the dead default.
  // If someone re-adds pollOverrides without wiring it up in poller.js, this
  // catches it immediately.
  assert.equal('pollOverrides' in DEFAULTS, false);
});
