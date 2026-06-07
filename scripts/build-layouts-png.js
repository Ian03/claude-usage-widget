// Renders assets/layouts.png — a side-by-side comparison of the four
// widget layouts (Expanded / Compact / Essential / Minimal) so the README
// can show what each density mode actually looks like instead of just
// listing them in a table.

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

const WIDTH = 1280;
const HEIGHT = 480;
const OUT = path.join(__dirname, '..', 'assets', 'layouts.png');
const WIDGET_CSS = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'widget.css'), 'utf8');

// Each card mirrors the production widget.css rules for that data-layout value.
// We inline a self-contained copy of the widget markup four times so the
// capture is one image, one HTTP request, no font flicker.
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
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 40px 32px 24px;
    height: 100%;
    box-sizing: border-box;
  }
  .col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .widget-frame { width: 260px; display: flex; align-items: flex-start; justify-content: center; min-height: 320px; }
  .widget-frame .widget { width: 244px; margin: 0; }
  .widget-frame[data-mode="minimal"] .widget { width: 140px; }
  .caption {
    color: #e9ecef;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.4px;
    text-align: center;
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
      <div class="caption">Expanded<span class="hint">Default · all the info</span></div>
      <div class="widget-frame" data-mode="expanded">${widgetMarkup('expanded')}</div>
    </div>
    <div class="col">
      <div class="caption">Compact<span class="hint">Header + bars, no countdowns</span></div>
      <div class="widget-frame" data-mode="compact">${widgetMarkup('compact')}</div>
    </div>
    <div class="col">
      <div class="caption">Essential<span class="hint">Tightest spacing, footer hidden</span></div>
      <div class="widget-frame" data-mode="essential">${widgetMarkup('essential')}</div>
    </div>
    <div class="col">
      <div class="caption">Minimal (pill)<span class="hint">Worst limit only · click to expand</span></div>
      <div class="widget-frame" data-mode="minimal">${widgetMarkup('minimal')}</div>
    </div>
  </div>
</body></html>`;

function widgetMarkup(layout) {
  const dot = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 5V2L7 7l5 5V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-7z"/></svg>';
  const cog = '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  const min = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
  const x   = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  const chev = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M7 14l5-5 5 5z"/></svg>';

  const limits = [
    { label: 'Current session', pct: 68, meta: 'resets in 2h 14m', sev: '' },
    { label: 'Weekly · all models', pct: 42, meta: 'resets in 6d', sev: '' },
    { label: 'Weekly · Sonnet', pct: 27, meta: 'resets in 6d', sev: '' },
    { label: 'Extra usage', pct: 11, meta: '', sev: '' },
  ];

  if (layout === 'minimal') {
    return `<div class="widget" data-theme="dark" data-layout="minimal">
      <div class="pill" style="-webkit-app-region:drag">
        <span class="pill-dot"></span>
        <span class="pill-pct">68%</span>
        <span class="pill-label">5h</span>
        <button class="icon-btn no-drag">${chev}</button>
      </div>
    </div>`;
  }

  const limitsHtml = limits.map(l => `
    <div class="limit">
      <div class="limit-head">
        <span class="limit-label">${l.label}</span>
        <span class="limit-pct">${l.pct}%</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${l.pct}%"></div></div>
      ${l.meta ? `<div class="limit-meta"><span>${l.meta}</span></div>` : ''}
    </div>`).join('');

  return `<div class="widget" data-theme="dark" data-layout="${layout}">
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
