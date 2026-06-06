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

let currentCfg = null;
let lastData = null;
let history = [];

function applyTheme(cfg) {
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
  staleBadge.hidden = !stale || !cfg.showStaleIndicator;
  errorBadge.hidden = !error;
  if (error) errorBadge.textContent = error.code === 'AUTH_EXPIRED' ? 'auth' : 'offline';

  renderGraph();
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
  // y inverted, scale 0..100
  const y = (v) => PAD + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - PAD * 2);

  // Build path
  let d = `M ${x(points[0].t)} ${y(points[0].v)}`;
  for (let i = 1; i < points.length; i++) d += ` L ${x(points[i].t)} ${y(points[i].v)}`;
  const areaD = `${d} L ${x(points[points.length - 1].t)} ${H - PAD} L ${x(points[0].t)} ${H - PAD} Z`;

  // 25/50/75 reference lines
  const gridY = [25, 50, 75].map((v) => `<line class="grid" x1="${PAD}" y1="${y(v)}" x2="${W - PAD}" y2="${y(v)}" />`).join('');

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

  setInterval(() => {
    if (lastData) render({ data: lastData, stale: staleBadge.hidden ? false : true, error: null });
  }, 30_000);
}

init();
