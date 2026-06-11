const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize } = require('../src/usage');

// Synthetic fixture modeled on the live `/api/oauth/usage` response shape.
// Field set and null placeholders mirror what Anthropic actually returns;
// the numbers are illustrative and intentionally easy to spot in failures.
const FIXTURE_PAYLOAD = {
  five_hour: { utilization: 50.0, resets_at: '2026-01-01T05:00:00.000000+00:00' },
  seven_day: { utilization: 25.0, resets_at: '2026-01-08T00:00:00.000000+00:00' },
  seven_day_oauth_apps: null,
  seven_day_opus: null,
  seven_day_sonnet: { utilization: 12.0, resets_at: '2026-01-08T00:00:00.000000+00:00' },
  seven_day_cowork: null,
  seven_day_omelette: null,
  tangelo: null,
  iguana_necktie: null,
  omelette_promotional: null,
  cinder_cove: null,
  extra_usage: {
    is_enabled: true,
    monthly_limit: 5000,
    used_credits: 225.0,
    utilization: 4.5,
    currency: 'USD',
    disabled_reason: null,
  },
};

test('normalize extracts only the active limits, skipping null placeholders', () => {
  const result = normalize(FIXTURE_PAYLOAD, { subscriptionType: 'pro', rateLimitTier: 'default' });
  const ids = result.limits.map((l) => l.id).sort();
  assert.deepEqual(ids, ['extra_usage', 'five_hour', 'seven_day', 'seven_day_sonnet']);
});

test('normalize labels common limits in friendly form', () => {
  const result = normalize(FIXTURE_PAYLOAD, {});
  const map = Object.fromEntries(result.limits.map((l) => [l.id, l.label]));
  assert.equal(map.five_hour, 'Current session');
  assert.equal(map.seven_day, 'Weekly · all models');
  assert.equal(map.seven_day_sonnet, 'Weekly · Sonnet');
  assert.equal(map.extra_usage, 'Extra usage');
});

test('normalize clamps utilization to 0..100 and preserves windowMs for known ids', () => {
  const result = normalize(FIXTURE_PAYLOAD, {});
  for (const l of result.limits) {
    assert.ok(l.utilization >= 0 && l.utilization <= 100, `utilization ${l.utilization} out of bounds`);
  }
  const fh = result.limits.find((l) => l.id === 'five_hour');
  const sd = result.limits.find((l) => l.id === 'seven_day');
  assert.equal(fh.windowMs, 5 * 60 * 60 * 1000);
  assert.equal(sd.windowMs, 7 * 24 * 60 * 60 * 1000);
});

test('normalize treats small utilization as a literal percent, not a 0..1 fraction', () => {
  const result = normalize({ seven_day_sonnet: { utilization: 1, resets_at: null } }, {});
  assert.equal(result.limits[0].utilization, 1);

  const frac = normalize({ five_hour: { utilization: 0.42, resets_at: null } }, {});
  assert.equal(frac.limits[0].utilization, 0.42);
});

test('normalize returns empty limits for empty payload, without crashing', () => {
  assert.deepEqual(normalize({}, {}).limits, []);
  assert.deepEqual(normalize(null, {}).limits, []);
});

test('normalize preserves subscription metadata for downstream use', () => {
  const r = normalize(FIXTURE_PAYLOAD, { subscriptionType: 'pro', rateLimitTier: 'default' });
  assert.equal(r.subscriptionType, 'pro');
  assert.equal(r.rateLimitTier, 'default');
});

test('normalize is resilient to a wrapper key (limits/quotas)', () => {
  const wrapped = { limits: { five_hour: { utilization: 50, resets_at: null } } };
  const r = normalize(wrapped, {});
  assert.equal(r.limits.length, 1);
  assert.equal(r.limits[0].utilization, 50);
});

test('normalize passes through the credit-pool fields on extra_usage', () => {
  const r = normalize(FIXTURE_PAYLOAD, {});
  const extra = r.limits.find((l) => l.id === 'extra_usage');
  assert.equal(extra.usedCredits, 225.0);
  assert.equal(extra.monthlyLimit, 5000);
  assert.equal(extra.currency, 'USD');
});

test('normalize skips limits where is_enabled is explicitly false', () => {
  // Mirrors a real account that has extra_usage configured but turned off —
  // the bar would otherwise render at 0% forever, which is noise.
  const r = normalize({
    extra_usage: { is_enabled: false, utilization: 0, monthly_limit: 5000, used_credits: 0 },
    five_hour: { utilization: 12, resets_at: null },
  }, {});
  assert.deepEqual(r.limits.map((l) => l.id), ['five_hour']);
});

test('normalize keeps the extra_usage row when is_enabled is true', () => {
  const r = normalize(FIXTURE_PAYLOAD, {});
  assert.ok(r.limits.find((l) => l.id === 'extra_usage'));
});

test('normalize does not attach credit-pool fields to limits that lack them', () => {
  // five_hour and seven_day don't carry monthly_limit / used_credits, so the
  // normalized objects should NOT have those keys defined — otherwise the
  // renderer's fmtMoney check (usedCredits == null) would mistake "undefined
  // but present" as "show empty dollar string".
  const r = normalize(FIXTURE_PAYLOAD, {});
  const fh = r.limits.find((l) => l.id === 'five_hour');
  assert.equal('usedCredits' in fh, false);
  assert.equal('monthlyLimit' in fh, false);
  assert.equal('currency' in fh, false);
});
