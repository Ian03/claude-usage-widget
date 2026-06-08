const $ = (id) => document.getElementById(id);
let cfg = null;
let saveTimer = null;

const BINDINGS = [
  { id: 'layout', path: ['layout'], type: 'value' },
  { id: 'alwaysOnTop', path: ['alwaysOnTop'], type: 'checked' },
  { id: 'clickThrough', path: ['clickThrough'], type: 'checked' },
  { id: 'showHeader', path: ['showHeader'], type: 'checked' },
  { id: 'showResetCountdown', path: ['showResetCountdown'], type: 'checked' },
  { id: 'showPaceMarker', path: ['showPaceMarker'], type: 'checked' },
  { id: 'showStaleIndicator', path: ['showStaleIndicator'], type: 'checked' },
  { id: 'showMascot', path: ['showMascot'], type: 'checked' },
  { id: 'theme', path: ['theme'], type: 'value' },
  { id: 'accentColor', path: ['accentColor'], type: 'value' },
  { id: 'opacity', path: ['opacity'], type: 'number', display: 'opacityVal', fmt: (v) => v.toFixed(2) },
  { id: 'cornerRadius', path: ['cornerRadius'], type: 'number', display: 'cornerRadiusVal', fmt: (v) => `${v}px` },
  { id: 'fontScale', path: ['fontScale'], type: 'number', display: 'fontScaleVal', fmt: (v) => `${Math.round(v * 100)}%` },
  { id: 'fontFamily', path: ['fontFamily'], type: 'value' },
  { id: 'blur', path: ['blur'], type: 'checked' },
  { id: 'trayIconStyle', path: ['trayIconStyle'], type: 'value' },
  { id: 'showHistoryGraph', path: ['showHistoryGraph'], type: 'checked' },
  { id: 'historyLimitId', path: ['historyLimitId'], type: 'value' },
  { id: 'warn', path: ['thresholds', 'warn'], type: 'number' },
  { id: 'critical', path: ['thresholds', 'critical'], type: 'number' },
  { id: 'okColor', path: ['colors', 'ok'], type: 'value' },
  { id: 'warnColor', path: ['colors', 'warn'], type: 'value' },
  { id: 'criticalColor', path: ['colors', 'critical'], type: 'value' },
  { id: 'notifyAtWarn', path: ['notifyAtWarn'], type: 'checked' },
  { id: 'notifyAtCritical', path: ['notifyAtCritical'], type: 'checked' },
  { id: 'onReset_five_hour', path: ['onReset', 'five_hour'], type: 'value' },
  { id: 'onReset_seven_day', path: ['onReset', 'seven_day'], type: 'value' },
  { id: 'onReset_seven_day_sonnet', path: ['onReset', 'seven_day_sonnet'], type: 'value' },
  { id: 'onReset_seven_day_opus', path: ['onReset', 'seven_day_opus'], type: 'value' },
  { id: 'openAtLogin', path: ['openAtLogin'], type: 'checked' },
  { id: 'openMinimized', path: ['openMinimized'], type: 'checked' },
  { id: 'checkForUpdates', path: ['checkForUpdates'], type: 'checked' },
];

function getPath(obj, path) {
  return path.reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null || typeof cur[path[i]] !== 'object') cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}

function load() {
  for (const b of BINDINGS) {
    const el = $(b.id);
    if (!el) continue;
    const val = getPath(cfg, b.path);
    if (b.type === 'checked') el.checked = !!val;
    else if (b.type === 'number') el.value = (val == null) ? '' : String(val);
    else el.value = val ?? '';
    if (b.display) $(b.display).textContent = b.fmt ? b.fmt(Number(val)) : String(val);
  }
}

function readForm() {
  const patch = {};
  for (const b of BINDINGS) {
    const el = $(b.id);
    if (!el) continue;
    let value;
    if (b.type === 'checked') value = el.checked;
    else if (b.type === 'number') value = Number(el.value);
    else value = el.value;
    setPath(patch, b.path, value);
    if (b.display) $(b.display).textContent = b.fmt ? b.fmt(Number(el.value)) : String(el.value);
  }
  return patch;
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const patch = readForm();
    cfg = await window.api.updateConfig(patch);
  }, 120);
}

async function init() {
  cfg = await window.api.getConfig();
  load();
  for (const b of BINDINGS) {
    const el = $(b.id);
    if (!el) continue;
    el.addEventListener('input', scheduleSave);
    el.addEventListener('change', scheduleSave);
  }
  $('openCreds').addEventListener('click', () => window.api.openCreds());
  $('quit').addEventListener('click', () => window.api.quit());
  window.api.onConfig((newCfg) => { cfg = newCfg; load(); });

  const checkBtn = $('checkUpdateNow');
  const status = $('updateStatus');
  if (checkBtn && status) {
    const renderUpdateStatus = (info) => {
      if (!info) { status.textContent = 'Never checked yet.'; return; }
      if (info.available) status.textContent = `v${info.latestVersion} is available — see the header link to download.`;
      else if (info.latestVersion) status.textContent = `You're on the latest version (v${info.latestVersion}).`;
      else status.textContent = '';
    };
    window.api.getUpdate?.().then(renderUpdateStatus);
    window.api.onUpdate?.(renderUpdateStatus);
    checkBtn.addEventListener('click', async () => {
      checkBtn.disabled = true;
      status.textContent = 'Checking…';
      try { await window.api.checkUpdate?.(); } finally { checkBtn.disabled = false; }
    });
  }
}

init();
