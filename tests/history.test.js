const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { History } = require('../src/history');

// Each test runs against its own scratch file so they don't trample each
// other or any real ~/.claude data on the dev machine.
function tmpHistoryFile(name) {
  const p = path.join(os.tmpdir(), `cuw-history-test-${process.pid}-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
  return p;
}

const usage = (t, limits) => ({ fetchedAt: t, limits });

test('add() dedupes samples within 1 minute', () => {
  const h = new History(tmpHistoryFile('dedupe'));
  // Use a non-zero base — history.add() treats 0 as "missing" and falls back
  // to Date.now(), which collapses these into one timestamp and hides the
  // dedupe behavior under test.
  const base = Date.now() - 10 * 60_000;
  h.add(usage(base, [{ id: 'five_hour', utilization: 50 }]));
  h.add(usage(base + 30_000, [{ id: 'five_hour', utilization: 55 }])); // 30s later — dedupe
  h.add(usage(base + 70_000, [{ id: 'five_hour', utilization: 60 }])); // 70s later — kept
  assert.equal(h.samples.length, 2);
  assert.equal(h.samples[0].five_hour, 50);
  assert.equal(h.samples[1].five_hour, 60);
});

test('add() trims samples older than 7 days', () => {
  const h = new History(tmpHistoryFile('trim-age'));
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  // Three points: 10 days ago (drop), 5 days ago (keep), now (keep).
  h.add(usage(now - 10 * day, [{ id: 'seven_day', utilization: 30 }]));
  h.add(usage(now - 5 * day, [{ id: 'seven_day', utilization: 40 }]));
  h.add(usage(now, [{ id: 'seven_day', utilization: 50 }]));
  // The trim happens relative to the *latest* sample's timestamp, so the 10-day
  // sample should be dropped.
  assert.equal(h.samples.length, 2);
  assert.ok(h.samples.every((s) => now - s.t <= 7 * day));
});

test('add() trims when sample count exceeds the cap', () => {
  const h = new History(tmpHistoryFile('trim-count'));
  // Stuff in 2050 points well within the 7-day window — cap is 2016.
  const base = Date.now() - 60_000 * 2100;
  for (let i = 0; i < 2050; i++) {
    h.add(usage(base + i * 60_001, [{ id: 'five_hour', utilization: i % 100 }]));
  }
  assert.ok(h.samples.length <= 2016, `expected <= 2016 samples, got ${h.samples.length}`);
});

test('add() ignores malformed usage (null or non-array limits)', () => {
  const h = new History(tmpHistoryFile('malformed'));
  h.add(null);
  h.add({});
  h.add({ limits: 'not-an-array' });
  h.add({ fetchedAt: Date.now() }); // no limits
  assert.equal(h.samples.length, 0);
});

test('series() filters to the requested limit id and time window', () => {
  const h = new History(tmpHistoryFile('series'));
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  h.add(usage(now - 3 * hour, [{ id: 'five_hour', utilization: 10 }, { id: 'seven_day', utilization: 25 }]));
  h.add(usage(now - 2 * hour, [{ id: 'five_hour', utilization: 20 }, { id: 'seven_day', utilization: 30 }]));
  h.add(usage(now - 1 * hour, [{ id: 'five_hour', utilization: 30 }]));

  const fh = h.series('five_hour');
  assert.equal(fh.length, 3);
  assert.deepEqual(fh.map((p) => p.v), [10, 20, 30]);

  const sd = h.series('seven_day');
  assert.equal(sd.length, 2, 'seven_day series should drop the point that lacks it');

  // Window cap: ask for last 90 minutes → only the most recent point qualifies.
  const recent = h.series('five_hour', 90 * 60 * 1000);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].v, 30);
});

test('hasMeaningfulData() requires at least 2 samples', () => {
  const h = new History(tmpHistoryFile('meaningful'));
  const base = Date.now() - 10 * 60_000;
  assert.equal(h.hasMeaningfulData(), false);
  h.add(usage(base, [{ id: 'five_hour', utilization: 10 }]));
  assert.equal(h.hasMeaningfulData(), false);
  h.add(usage(base + 70_000, [{ id: 'five_hour', utilization: 20 }]));
  assert.equal(h.hasMeaningfulData(), true);
});

test('load() preserves a writable empty state when the file does not exist', () => {
  const p = tmpHistoryFile('absent');
  // Make sure it really isn't there.
  try { fs.unlinkSync(p); } catch {}
  const h = new History(p);
  assert.deepEqual(h.samples, []);
  // And new samples land on disk after load.
  h.add(usage(Date.now(), [{ id: 'five_hour', utilization: 50 }]));
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(Array.isArray(raw.samples));
  assert.equal(raw.samples.length, 1);
});

test('load() moves a corrupted file aside and starts fresh', () => {
  const p = tmpHistoryFile('corrupt');
  fs.writeFileSync(p, '{not valid json');
  // Silence the expected console.error noise during this assertion.
  const origError = console.error;
  console.error = () => {};
  try {
    const h = new History(p);
    assert.deepEqual(h.samples, []);
    // The bad file should have been renamed to a .corrupt-<ts> sibling, and
    // the original path should be free for a fresh write.
    const dir = path.dirname(p);
    const base = path.basename(p);
    const corruptSibling = fs.readdirSync(dir).find((f) => f.startsWith(`${base}.corrupt-`));
    assert.ok(corruptSibling, 'expected a .corrupt-<ts> sibling next to the input path');
    fs.unlinkSync(path.join(dir, corruptSibling));
  } finally {
    console.error = origError;
  }
});
