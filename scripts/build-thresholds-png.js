// Renders assets/thresholds.png — same widget at OK / Warn / Critical
// severity states side by side, so the README can show the visual
// urgency design (green -> yellow -> red bars + dot) at a glance.

if (typeof process.versions.electron === 'undefined') {
  delete process.env.ELECTRON_RUN_AS_NODE;
  delete process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
  const { spawn } = require('child_process');
  const electronPath = require('electron');
  const child = spawn(electronPath, [__filename], { stdio: 'inherit', env: process.env });
  child.on('close', (code) => process.exit(code ?? 0));
  return;
}

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const WIDTH = 1100;
const HEIGHT = 460;
const OUT = path.join(__dirname, '..', 'assets', 'thresholds.png');
const WIDGET_CSS = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'widget.css'), 'utf8');

function widgetMarkup({ pct, sev, dotSev }) {
  const dot = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 5V2L7 7l5 5V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-7z"/></svg>';
  const cog = '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  const min = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
  const x   = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  const sevClass = sev || '';
  return `<div class="widget" data-theme="dark" data-layout="expanded">
    <header class="drag">
      <div class="title"><span class="dot ${dotSev}"></span><span>Claude usage</span></div>
      <div class="actions">
        <button class="icon-btn">${dot}</button>
        <button class="icon-btn">${cog}</button>
        <button class="icon-btn">${min}</button>
        <button class="icon-btn">${x}</button>
      </div>
    </header>
    <div class="body">
      <div class="limits">
        <div class="limit">
          <div class="limit-head">
            <span class="limit-label">Current session</span>
            <span class="limit-pct">${pct}%</span>
          </div>
          <div class="bar"><div class="bar-fill ${sevClass}" style="width:${pct}%"></div></div>
          <div class="limit-meta"><span>resets in 2h 14m</span></div>
        </div>
        <div class="limit">
          <div class="limit-head">
            <span class="limit-label">Weekly · all models</span>
            <span class="limit-pct">42%</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:42%"></div></div>
          <div class="limit-meta"><span>resets in 6d</span></div>
        </div>
      </div>
      <div class="footer"><span>Updated just now</span></div>
    </div>
  </div>`;
}

const STATES = [
  { pct: 32, sev: '',         dotSev: '',         caption: 'OK',       hint: 'Under the warn threshold' },
  { pct: 78, sev: 'warn',     dotSev: 'warn',     caption: 'Warn',     hint: 'Bar + dot turn yellow at 75%' },
  { pct: 91, sev: 'critical', dotSev: 'critical', caption: 'Critical', hint: 'Bar + dot turn red, dot pulses at 90%' },
];

const cols = STATES.map(s => `
  <div class="col">
    <div class="caption">${s.caption}<span class="hint">${s.hint}</span></div>
    <div class="widget-frame">${widgetMarkup(s)}</div>
  </div>
`).join('');

const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<style>${WIDGET_CSS}</style>
<style>
  html, body {
    margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px;
    background: linear-gradient(135deg, #2a3b52 0%, #1f3144 50%, #233447 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }
  .stage {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    padding: 36px 32px;
    height: 100%;
    box-sizing: border-box;
  }
  .col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .widget-frame .widget { width: 280px; margin: 0; }
  .caption {
    color: #e9ecef;
    font-weight: 700;
    font-size: 15px;
    text-align: center;
    letter-spacing: 0.4px;
  }
  .caption .hint {
    display: block;
    font-weight: 400;
    font-size: 11px;
    color: rgba(233, 236, 239, 0.65);
    margin-top: 3px;
    letter-spacing: 0;
  }
</style></head>
<body><div class="stage">${cols}</div></body></html>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    useContentSize: true,
    webPreferences: { offscreen: true },
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(HTML));
  await new Promise(r => setTimeout(r, 400));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  const stat = fs.statSync(OUT);
  console.log(`Wrote ${OUT} (${WIDTH}x${HEIGHT}, ${stat.size} bytes)`);
  app.quit();
});
