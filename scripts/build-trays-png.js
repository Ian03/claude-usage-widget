// Renders assets/trays.png — a row of the 5 tray icon styles (Bars,
// Battery, Gauge, Minimal, Dynamic) so the README can show what each
// option looks like instead of just listing them.
//
// Uses src/icon.js (the same primitives the live tray uses) so what
// users see in the README is bit-identical to what they'll see in
// their system tray.

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
const icon = require('../src/icon');

const WIDTH = 1100;
const HEIGHT = 280;
const OUT = path.join(__dirname, '..', 'assets', 'trays.png');

// Generate each style as a base64 data URL so the showcase HTML can
// embed them without writing intermediate files.
function styleAsDataUrl(style, opts) {
  const c = icon.draw(style, 128, opts);
  const png = icon.encodePNG(c.w, c.h, c.buf);
  return 'data:image/png;base64,' + png.toString('base64');
}

const STYLES = [
  { id: 'bars',     caption: 'Bars',     hint: 'Abstract, on-brand',          opts: {} },
  { id: 'battery',  caption: 'Battery',  hint: 'Fill = worst utilization',    opts: { pct: 65 } },
  { id: 'gauge',    caption: 'Gauge',    hint: 'Circular progress',           opts: { pct: 65 } },
  { id: 'minimal',  caption: 'Minimal',  hint: 'Solid colored dot',           opts: {} },
  // "Dynamic" picks a representation live; we render a gauge tinted warn-yellow
  // to convey the idea that this style reflects the live severity.
  { id: 'gauge',    caption: 'Dynamic',  hint: 'Auto-picks + lives the color', opts: { pct: 78, severity: [0xF5, 0xB4, 0x00, 0xFF] } },
];

const cells = STYLES.map(s => `
  <div class="col">
    <img src="${styleAsDataUrl(s.id, s.opts)}" width="96" height="96" alt="${s.caption}">
    <div class="caption">${s.caption}<span class="hint">${s.hint}</span></div>
  </div>
`).join('');

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body {
    margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px;
    background: linear-gradient(135deg, #2a3b52 0%, #1f3144 50%, #233447 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    overflow: hidden;
  }
  .stage {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    padding: 36px 32px;
    height: 100%;
    box-sizing: border-box;
  }
  .col { display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .col img { image-rendering: -webkit-optimize-contrast; }
  .caption {
    color: #e9ecef;
    font-weight: 700;
    font-size: 15px;
    text-align: center;
    letter-spacing: 0.3px;
  }
  .caption .hint {
    display: block;
    font-weight: 400;
    font-size: 11px;
    color: rgba(233, 236, 239, 0.6);
    margin-top: 3px;
    letter-spacing: 0;
  }
</style></head>
<body><div class="stage">${cells}</div></body></html>`;

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
