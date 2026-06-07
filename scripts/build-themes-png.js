// Renders assets/themes.png — widget rendered in dark and light themes
// side-by-side so the README can show the theme support visually.

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

const WIDTH = 800;
const HEIGHT = 460;
const OUT = path.join(__dirname, '..', 'assets', 'themes.png');
const WIDGET_CSS = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'widget.css'), 'utf8');

function widgetMarkup(theme) {
  const limits = [
    { label: 'Current session', pct: 68, meta: 'resets in 2h 14m' },
    { label: 'Weekly · all models', pct: 42, meta: 'resets in 6d' },
    { label: 'Weekly · Sonnet', pct: 27, meta: 'resets in 6d' },
    { label: 'Extra usage', pct: 11, meta: '' },
  ];
  const dot = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 5V2L7 7l5 5V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-7z"/></svg>';
  const cog = '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  const min = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
  const x   = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  const limitsHtml = limits.map(l => `
    <div class="limit">
      <div class="limit-head">
        <span class="limit-label">${l.label}</span>
        <span class="limit-pct">${l.pct}%</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${l.pct}%"></div></div>
      ${l.meta ? `<div class="limit-meta"><span>${l.meta}</span></div>` : ''}
    </div>`).join('');

  return `<div class="widget" data-theme="${theme}" data-layout="expanded">
    <header class="drag">
      <div class="title"><span class="dot"></span><span>Claude usage</span></div>
      <div class="actions">
        <button class="icon-btn">${dot}</button>
        <button class="icon-btn">${cog}</button>
        <button class="icon-btn">${min}</button>
        <button class="icon-btn">${x}</button>
      </div>
    </header>
    <div class="body">
      <div class="limits">${limitsHtml}</div>
      <div class="footer"><span>Updated just now</span></div>
    </div>
  </div>`;
}

const HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<style>${WIDGET_CSS}</style>
<style>
  html, body {
    margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px;
    background: linear-gradient(120deg, #232b3a 0%, #1f3144 50%, #2a3550 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }
  .stage {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    padding: 40px 48px 24px;
    height: 100%;
    box-sizing: border-box;
    align-items: start;
  }
  .col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .widget-frame .widget { width: 264px; margin: 0; }
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
<body>
  <div class="stage">
    <div class="col">
      <div class="caption">Dark<span class="hint">Default · follows OS</span></div>
      <div class="widget-frame">${widgetMarkup('dark')}</div>
    </div>
    <div class="col">
      <div class="caption">Light<span class="hint">High-contrast for daytime</span></div>
      <div class="widget-frame">${widgetMarkup('light')}</div>
    </div>
  </div>
</body></html>`;

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
