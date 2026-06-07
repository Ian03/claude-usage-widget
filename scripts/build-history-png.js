// Renders assets/history.png — widget with the 7-day history graph
// expanded and populated with synthetic-but-realistic sample data
// (mirrors what users see after the widget has been running a week).

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

const WIDTH = 700;
const HEIGHT = 540;
const OUT = path.join(__dirname, '..', 'assets', 'history.png');
const WIDGET_CSS = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'widget.css'), 'utf8');

// Build a 7-day weekly-usage curve: starts low Monday, ramps through
// Wednesday/Thursday, peaks Friday, dips weekend, recovers to ~60%.
// One sample every 30 min over 7 days = ~336 points; we use 96 for
// a clean readable line.
function syntheticPoints() {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const n = 96;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = now - week + (i / (n - 1)) * week;
    const day = i / (n - 1) * 7;
    // Story arc: light Mon-Tue (~10-25%), ramp Wed-Thu, peak Fri (~70%),
    // small weekend dip, finishes mid-60s — exactly the shape that makes
    // a user think "I should pace myself this week."
    let v = 6
      + 9 * day                  // steady linear ramp
      + 14 * Math.sin(day * 1.1) // mid-week bulge + weekend dip
      + (i % 4 === 0 ? 2 : -1);  // mild jitter so the line isn't artificially smooth
    v = Math.max(4, Math.min(78, v));
    pts.push({ t, v });
  }
  return pts;
}

const POINTS = syntheticPoints();
const CURRENT = POINTS[POINTS.length - 1].v.toFixed(0);

// Inline the widget markup with the graph expanded. SVG path is
// computed here (in Node) so the screenshot is deterministic.
function buildGraphSvg() {
  const W = 260, H = 60, PAD = 4;
  const t0 = POINTS[0].t, t1 = POINTS[POINTS.length - 1].t;
  const span = Math.max(1, t1 - t0);
  const x = (t) => PAD + ((t - t0) / span) * (W - PAD * 2);
  const y = (v) => PAD + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - PAD * 2);
  let d = `M ${x(POINTS[0].t).toFixed(2)} ${y(POINTS[0].v).toFixed(2)}`;
  for (let i = 1; i < POINTS.length; i++) d += ` L ${x(POINTS[i].t).toFixed(2)} ${y(POINTS[i].v).toFixed(2)}`;
  const areaD = `${d} L ${x(POINTS[POINTS.length - 1].t).toFixed(2)} ${H - PAD} L ${x(POINTS[0].t).toFixed(2)} ${H - PAD} Z`;
  const gridY = [25, 50, 75].map((v) => `<line class="grid" x1="${PAD}" y1="${y(v).toFixed(2)}" x2="${W - PAD}" y2="${y(v).toFixed(2)}" />`).join('');
  return `${gridY}<path class="area" d="${areaD}" /><path class="line" d="${d}" />`;
}

function widgetMarkup() {
  const refresh = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 5V2L7 7l5 5V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-7z"/></svg>';
  const cog = '<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  const min = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
  const x   = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  return `<div class="widget" data-theme="dark" data-layout="expanded">
    <header class="drag">
      <div class="title"><span class="dot"></span><span>Claude usage</span></div>
      <div class="actions">
        <button class="icon-btn">${refresh}</button>
        <button class="icon-btn">${cog}</button>
        <button class="icon-btn">${min}</button>
        <button class="icon-btn">${x}</button>
      </div>
    </header>
    <div class="body">
      <div class="limits">
        <div class="limit">
          <div class="limit-head">
            <span class="limit-label">Weekly · all models</span>
            <span class="limit-pct">${CURRENT}%</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${CURRENT}%"></div></div>
          <div class="limit-meta"><span>resets in 2d 8h</span></div>
        </div>
      </div>
      <div class="graph-wrap">
        <div class="graph-head">
          <span>Weekly · all models · 7-day history</span>
          <span class="graph-sub">${CURRENT}% now</span>
        </div>
        <svg class="graph" viewBox="0 0 260 60" preserveAspectRatio="none">
          ${buildGraphSvg()}
        </svg>
      </div>
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
    background: linear-gradient(135deg, #2a3b52 0%, #1f3144 50%, #233447 100%);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .frame { display: flex; flex-direction: column; gap: 14px; align-items: center; }
  .frame .widget { width: 320px; margin: 0; }
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
  <div class="frame">
    <div class="caption">7-day history graph<span class="hint">Toggle on; pick which limit to plot</span></div>
    ${widgetMarkup()}
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
