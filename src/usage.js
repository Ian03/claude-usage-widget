const fs = require('fs');
const os = require('os');
const path = require('path');

const CREDS_PATH = path.join(os.homedir(), '.claude', '.credentials.json');
const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';
const BETA_HEADER = 'oauth-2025-04-20';

// Known window lengths per limit id. Pace marker uses these to compute the
// actual start of the current window (resets_at minus window_length). Previously
// we inferred from time-to-reset which drifted near the moment of reset.
const WINDOW_MS = {
  five_hour: 5 * 60 * 60 * 1000,
  seven_day: 7 * 24 * 60 * 60 * 1000,
  seven_day_sonnet: 7 * 24 * 60 * 60 * 1000,
  seven_day_opus: 7 * 24 * 60 * 60 * 1000,
  seven_day_cowork: 7 * 24 * 60 * 60 * 1000,
  seven_day_oauth_apps: 7 * 24 * 60 * 60 * 1000,
};

function readToken() {
  let raw;
  try {
    raw = fs.readFileSync(CREDS_PATH, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      // Distinct from AUTH_EXPIRED: the file has never existed, so the user
      // has not signed in via Claude Code yet. The UI shows an onboarding
      // message instead of the generic "offline" badge.
      const err = new Error('No Claude Code login found. Run `claude` in a terminal to sign in.');
      err.code = 'NO_CREDS';
      throw err;
    }
    throw e;
  }
  const creds = JSON.parse(raw);
  const oauth = creds.claudeAiOauth;
  if (!oauth || !oauth.accessToken) {
    const err = new Error('claudeAiOauth.accessToken missing from ~/.claude/.credentials.json');
    err.code = 'NO_CREDS';
    throw err;
  }
  return {
    token: oauth.accessToken,
    expiresAt: oauth.expiresAt,
    subscriptionType: oauth.subscriptionType,
    rateLimitTier: oauth.rateLimitTier,
  };
}

async function fetchUsage({ retryOnAuth = true } = {}) {
  const { token, subscriptionType, rateLimitTier } = readToken();
  const res = await fetch(USAGE_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'anthropic-beta': BETA_HEADER,
      'User-Agent': 'claude-usage-widget/0.1',
    },
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10);
    const err = new Error('Rate limited');
    err.code = 'RATE_LIMITED';
    err.retryAfter = retryAfter;
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    // Token may have been refreshed by another Claude Code session between
    // our last readToken() and this fetch. Re-read once and retry immediately.
    if (retryOnAuth) {
      const fresh = readToken();
      if (fresh.token !== token) return fetchUsage({ retryOnAuth: false });
    }
    const err = new Error('Auth expired — run `claude` in a terminal to refresh.');
    err.code = 'AUTH_EXPIRED';
    throw err;
  }
  if (!res.ok) {
    // Drain the body to free the socket, but do NOT include it in the error
    // message — Anthropic occasionally echoes the bearer token in error
    // bodies ("invalid token: sk-…") and we broadcast errors to the renderer
    // / log them locally. Status + statusText is enough to drive backoff.
    await res.text().catch(() => '');
    const err = new Error(`Usage fetch failed: HTTP ${res.status} ${res.statusText || ''}`.trim());
    err.code = 'HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // A 2xx response with a malformed body (proxy interference, partial
    // download, surprise HTML error page) used to crash the poller's tick.
    // Surface as a normal HTTP_ERROR so the existing backoff applies.
    const err = new Error('Server returned a non-JSON response.');
    err.code = 'HTTP_ERROR';
    err.status = res.status;
    throw err;
  }
  return normalize(data, { subscriptionType, rateLimitTier });
}

function normalize(raw, meta = {}) {
  const limits = [];
  const seen = new Set();
  const candidates = [];

  if (raw && typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      if (value && typeof value === 'object' && ('utilization' in value || 'percent' in value || 'usage' in value)) {
        candidates.push([key, value]);
      }
    }
    for (const wrapKey of ['limits', 'quotas', 'rate_limits']) {
      if (raw[wrapKey] && typeof raw[wrapKey] === 'object') {
        for (const [key, value] of Object.entries(raw[wrapKey])) {
          if (value && typeof value === 'object') candidates.push([key, value]);
        }
      }
    }
  }

  for (const [key, value] of candidates) {
    if (seen.has(key)) continue;
    seen.add(key);
    const utilization = pickNumber(value.utilization, value.percent, value.percentage, value.usage);
    if (utilization == null) continue;
    // Skip limits the API explicitly marks disabled (e.g. extra_usage when the
    // user hasn't opted in). Showing "0%" for something that can never grow
    // would just be confusing noise.
    if (value.is_enabled === false) continue;
    const limit = {
      id: key,
      label: prettyLabel(key),
      utilization: clamp(utilization, 0, 100),
      resetsAt: value.resets_at || value.resetsAt || value.reset_at || null,
      windowMs: WINDOW_MS[key] || null,
    };
    // Credit-pool limits (extra_usage) expose dollar amounts alongside the
    // percentage. The API returns these in cents (e.g. 1386 for "$13.86",
    // 10000 for a "$100" cap) — convert to whole-currency units so the
    // renderer can format them with Intl.NumberFormat directly. Without this
    // the widget displayed 100× the real value ($1,386 of $10,000 instead of
    // $13.86 of $100), which is why v0.2.17 ships this fix.
    const usedCentsRaw = pickNumber(value.used_credits, value.usedCredits);
    const limitCentsRaw = pickNumber(value.monthly_limit, value.monthlyLimit);
    if (usedCentsRaw != null) limit.usedCredits = usedCentsRaw / 100;
    if (limitCentsRaw != null) limit.monthlyLimit = limitCentsRaw / 100;
    if (typeof value.currency === 'string' && value.currency) limit.currency = value.currency;
    limits.push(limit);
  }

  return {
    fetchedAt: Date.now(),
    limits,
    subscriptionType: meta.subscriptionType || null,
    rateLimitTier: meta.rateLimitTier || null,
  };
}

function pickNumber(...values) {
  for (const v of values) {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return null;
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function prettyLabel(key) {
  const map = {
    five_hour: 'Current session',
    seven_day: 'Weekly · all models',
    seven_day_sonnet: 'Weekly · Sonnet',
    seven_day_opus: 'Weekly · Opus',
    seven_day_cowork: 'Weekly · Cowork',
    cowork: 'Cowork',
    routines: 'Daily routines',
    extra_usage: 'Extra usage',
  };
  if (map[key]) return map[key];
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { fetchUsage, readToken, normalize, CREDS_PATH, WINDOW_MS };
