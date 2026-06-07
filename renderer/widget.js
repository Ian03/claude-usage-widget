const $ = (id) => document.getElementById(id);
const root = $('root');
const limitsEl = $('limits');
const lastUpdatedEl = $('lastUpdated');
const staleBadge = $('staleBadge');
const errorBadge = $('errorBadge');
const statusDot = $('statusDot');
const graphWrap = $('graphWrap');
const graphSvg = $('graph');
const graphEmpty = $('graphEmpty');
const graphTitle = $('graphTitle');
const graphSub = $('graphSub');
const pillDot = $('pillDot');
const pillPct = $('pillPct');
const pillLabel = $('pillLabel');

let currentCfg = null;
let lastData = null;
let lastError = null;
let history = [];
let pendingResize = false;
let lastSentHeight = 0;

// "Syncing" and "paused" are soft framings for stale / rate-limited. They're
// only surfaced once the condition has actually persisted long enough to be
// worth a user's attention — sub-minute blips never reach the UI, so a
// non-technical user doesn't get alarmed by transient quirks.
const SOFT_STALE_MS = 5 * 60 * 1000;
const SOFT_THROTTLE_MS = 2 * 60 * 1000;
let staleSince = null;
let throttledSince = null;

// Ask main to fit the window to the actual content height. The expanded layout
// has variable rows (N limits × optional countdown + optional graph + footer),
// so a hardcoded window height clips the bottom. Re-runs whenever the .widget
// box resizes via ResizeObserver below.
function requestFit() {
  if (pendingResize) return;
  pendingResize = true;
  requestAnimationFrame(() => {
    pendingResize = false;
    if (!currentCfg || currentCfg.layout === 'minimal') return;
    const h = root.offsetHeight + 16; // 8px margin top + 8px margin bottom
    if (h <= 0 || h === lastSentHeight) return;
    lastSentHeight = h;
    window.api.resize?.(h);
  });
}

if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => requestFit()).observe(root);
}

function applyTheme(cfg) {
  // Layout swaps (minimal <-> expanded) change the window dimensions outside
  // the renderer's knowledge, so clear the cached height to force a refit.
  if (currentCfg && currentCfg.layout !== cfg.layout) lastSentHeight = 0;
  currentCfg = cfg;
  const theme = cfg.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : cfg.theme;
  root.dataset.theme = theme;
  root.dataset.layout = cfg.layout;
  root.classList.toggle('no-blur', !cfg.blur);
  root.classList.toggle('no-header', !cfg.showHeader);

  const ds = document.documentElement.style;
  ds.setProperty('--accent', cfg.accentColor);
  ds.setProperty('--ok', cfg.colors.ok);
  ds.setProperty('--warn', cfg.colors.warn);
  ds.setProperty('--critical', cfg.colors.critical);
  ds.setProperty('--radius', `${cfg.cornerRadius}px`);
  ds.setProperty('--font-scale', cfg.fontScale);
  if (cfg.fontFamily && cfg.fontFamily !== 'system') ds.setProperty('--font-family', cfg.fontFamily);
  else ds.removeProperty('--font-family');
}

function severity(pct, cfg) {
  if (pct >= cfg.thresholds.critical) return 'critical';
  if (pct >= cfg.thresholds.warn) return 'warn';
  return 'ok';
}

// Now we use the actual window length from the data layer (mapped by limit id)
// instead of inferring from time-to-reset. This stays accurate even right after
// a reset moment.
function paceFraction(limit) {
  if (!limit.resetsAt || !limit.windowMs) return null;
  const now = Date.now();
  const reset = new Date(limit.resetsAt).getTime();
  const start = reset - limit.windowMs;
  const elapsed = now - start;
  if (elapsed <= 0) return 0;
  return Math.max(0, Math.min(1, elapsed / limit.windowMs));
}

function fmtCountdown(resetsAt) {
  if (!resetsAt) return '';
  const ms = new Date(resetsAt).getTime() - Date.now();
  if (ms <= 0) return 'resetting…';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `resets in ${d}d ${h}h`;
  if (h > 0) return `resets in ${h}h ${m}m`;
  return `resets in ${m}m`;
}

function fmtAge(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function render(payload) {
  const { data, stale, error } = payload;
  lastData = data;
  lastError = error || null;

  // Track when each soft state began so the badge only surfaces after the
  // condition has persisted past its threshold. Clearing on recovery means a
  // brief blip never even reaches the user's eyes.
  if (stale) { if (staleSince == null) staleSince = Date.now(); }
  else { staleSince = null; }
  if (error && error.code === 'RATE_LIMITED') {
    if (throttledSince == null) throttledSince = Date.now();
  } else {
    throttledSince = null;
  }

  if (!data || !data.limits) {
    limitsEl.innerHTML = '<div class="limit-label" style="opacity:0.7">Waiting for first fetch…</div>';
    return;
  }

  const cfg = currentCfg;
  let worstSeverity = 'ok';

  limitsEl.innerHTML = '';
  for (const limit of data.limits) {
    const pct = limit.utilization;
    const sev = severity(pct, cfg);
    if (sev === 'critical') worstSeverity = 'critical';
    else if (sev === 'warn' && worstSeverity !== 'critical') worstSeverity = 'warn';

    const row = document.createElement('div');
    row.className = 'limit';
    row.innerHTML = `
      <div class="limit-head">
        <span class="limit-label">${escapeHtml(limit.label)}</span>
        <span class="limit-pct">${pct.toFixed(0)}%</span>
      </div>
      <div class="bar">
        <div class="bar-fill ${sev === 'ok' ? '' : sev}" style="width:${pct}%"></div>
        ${cfg.showPaceMarker ? renderPace(limit, pct) : ''}
      </div>
      ${cfg.showResetCountdown && limit.resetsAt ? `<div class="limit-meta"><span>${escapeHtml(fmtCountdown(limit.resetsAt))}</span></div>` : ''}
    `;
    limitsEl.appendChild(row);
  }

  statusDot.className = `dot ${stale ? 'stale' : worstSeverity}`;
  lastUpdatedEl.textContent = `Updated ${fmtAge(data.fetchedAt)}`;
  renderPill(data, stale, worstSeverity);

  const staleLong = staleSince != null && (Date.now() - staleSince) >= SOFT_STALE_MS;
  staleBadge.hidden = !stale || !cfg.showStaleIndicator || !staleLong;

  const eb = errorBadgeFor(error);
  errorBadge.hidden = eb.hidden;
  if (!eb.hidden) {
    errorBadge.textContent = eb.label;
    errorBadge.title = eb.title;
    errorBadge.classList.toggle('error', eb.kind === 'error');
    errorBadge.classList.toggle('warn', eb.kind === 'warn');
    errorBadge.classList.toggle('soft', eb.kind === 'soft');
  }

  renderGraph();
}

// The error-badge label needs to tell the user what's actually going on.
// "OFFLINE" for a 429 made people think the widget was broken. Each error
// class gets its own label + tooltip; rate-limit is warn-colored, not red,
// because it isn't an error — it's "please wait, the API throttled us."
function errorBadgeFor(error) {
  if (!error) return { hidden: true };
  if (error.code === 'AUTH_EXPIRED') {
    return {
      hidden: false,
      label: 'auth',
      kind: 'error',
      title: 'OAuth token expired. Run `claude` in a terminal once to refresh; the widget will pick up the new token on the next poll.',
    };
  }
  if (error.code === 'RATE_LIMITED') {
    // Stay silent for the first couple of minutes — most rate-limit windows
    // clear within ~60s and surfacing "throttled" would just panic the user.
    const throttledLong = throttledSince != null && (Date.now() - throttledSince) >= SOFT_THROTTLE_MS;
    if (!throttledLong) return { hidden: true };
    return {
      hidden: false,
      label: 'paused',
      kind: 'soft',
      title: 'Pausing briefly — Anthropic asked us to wait. The widget will pick back up on its own.',
    };
  }
  if (error.code === 'HTTP_ERROR') {
    return {
      hidden: false,
      label: 'server',
      kind: 'error',
      title: error.message || 'Server returned an unexpected status.',
    };
  }
  return {
    hidden: false,
    label: 'offline',
    kind: 'error',
    title: error.message || 'Network error — the widget will retry.',
  };
}

// Pill mode shows only the worst-utilized limit at a glance. The label is
// kept tight ("week", "5h", etc) so a non-technical user can read it without
// thinking — the colored dot already encodes severity.
function renderPill(data, stale, worstSeverity) {
  if (!data || !data.limits || data.limits.length === 0) {
    pillPct.textContent = '—';
    pillLabel.textContent = '';
    pillDot.className = `pill-dot ${stale ? 'stale' : ''}`;
    return;
  }
  const worst = data.limits.reduce((a, b) => (a.utilization > b.utilization ? a : b));
  pillPct.textContent = `${Math.round(worst.utilization)}%`;
  pillLabel.textContent = shortLabel(worst);
  pillDot.className = `pill-dot ${stale ? 'stale' : worstSeverity}`;
}

function shortLabel(limit) {
  const id = limit.id || '';
  if (id.startsWith('seven_day')) return 'week';
  if (id === 'five_hour') return '5h';
  if (id === 'extra')      return 'extra';
  // Fallback: first word of the label.
  return (limit.label || '').split(/[\s·-]/)[0].toLowerCase();
}

function renderPace(limit, pct) {
  const frac = paceFraction(limit);
  if (frac == null) return '';
  const idealPct = frac * 100;
  const over = pct > idealPct + 5;
  return `<div class="pace ${over ? 'over' : ''}" style="left:${idealPct}%"></div>`;
}

function renderGraph() {
  const cfg = currentCfg;
  if (!cfg?.showHistoryGraph) { graphWrap.hidden = true; return; }
  graphWrap.hidden = false;

  const limitId = cfg.historyLimitId || 'seven_day';
  const limit = lastData?.limits?.find((l) => l.id === limitId);
  graphTitle.textContent = limit ? `${limit.label} · 7-day history` : '7-day history';
  graphSub.textContent = limit ? `${limit.utilization.toFixed(0)}% now` : '';

  // Filter history samples to those with this limit
  const points = (history || [])
    .filter((s) => typeof s[limitId] === 'number')
    .map((s) => ({ t: s.t, v: s[limitId] }));

  if (points.length < 2) {
    graphSvg.innerHTML = '';
    graphEmpty.hidden = false;
    return;
  }
  graphEmpty.hidden = true;

  const W = 260, H = 60, PAD = 4;
  const t0 = points[0].t;
  const t1 = Math.max(points[points.length - 1].t, Date.now());
  const span = Math.max(1, t1 - t0);
  const x = (t) => PAD + ((t - t0) / span) * (W - PAD * 2);

  // Auto-scale Y so low-utilization series still read as a real line instead
  // of hugging the floor. Floor the scale at 25 so a flat-zero chart keeps
  // some headroom and gridlines remain meaningful.
  const peak = points.reduce((m, p) => Math.max(m, p.v), 0);
  const yMax = Math.min(100, Math.max(25, peak * 1.2));
  const y = (v) => PAD + (1 - Math.max(0, Math.min(yMax, v)) / yMax) * (H - PAD * 2);

  let d = `M ${x(points[0].t)} ${y(points[0].v)}`;
  for (let i = 1; i < points.length; i++) d += ` L ${x(points[i].t)} ${y(points[i].v)}`;
  const areaD = `${d} L ${x(points[points.length - 1].t)} ${H - PAD} L ${x(points[0].t)} ${H - PAD} Z`;

  // Gridlines at 1/4, 1/2, 3/4 of the visible scale (not fixed 25/50/75).
  const gridY = [0.25, 0.5, 0.75].map((f) => {
    const yi = PAD + (1 - f) * (H - PAD * 2);
    return `<line class="grid" x1="${PAD}" y1="${yi}" x2="${W - PAD}" y2="${yi}" />`;
  }).join('');

  graphSvg.innerHTML = `${gridY}<path class="area" d="${areaD}" /><path class="line" d="${d}" />`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function init() {
  const cfg = await window.api.getConfig();
  applyTheme(cfg);

  const { data, error, history: hist } = await window.api.getLastUsage();
  history = hist || [];
  if (data) render({ data, stale: false, error });
  else if (error) render({ data: null, stale: true, error });

  window.api.onUsage(({ data, stale, history: hist }) => {
    if (hist) history = hist;
    render({ data, stale, error: null });
  });
  window.api.onError(({ error, lastData }) => render({ data: lastData, stale: true, error }));
  window.api.onConfig((newCfg) => {
    applyTheme(newCfg);
    if (lastData) render({ data: lastData, stale: false, error: null });
  });

  $('refreshBtn').addEventListener('click', async () => {
    const btn = $('refreshBtn');
    btn.classList.add('spinning');
    await window.api.refresh();
    setTimeout(() => btn.classList.remove('spinning'), 500);
  });
  $('settingsBtn').addEventListener('click', () => window.api.openSettings());
  $('closeBtn').addEventListener('click', () => window.api.quit());

  $('minimizeBtn').addEventListener('click', () => {
    const keep = currentCfg.layout === 'minimal' ? currentCfg.lastExpandedLayout : currentCfg.layout;
    window.api.updateConfig({ layout: 'minimal', lastExpandedLayout: keep || 'expanded' });
  });
  $('expandBtn').addEventListener('click', () => {
    window.api.updateConfig({ layout: currentCfg.lastExpandedLayout || 'expanded' });
  });

  setInterval(() => {
    // Preserve the last known error so the soft "syncing"/"paused" gates
    // continue to count up instead of resetting every 30s.
    if (lastData) render({ data: lastData, stale: !!lastError || (staleSince != null), error: lastError });
  }, 30_000);
}

init();
