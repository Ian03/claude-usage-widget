// Renders a 1280x640 social-preview PNG (GitHub OpenGraph image) by loading
// an HTML template in a hidden Electron BrowserWindow and capturing it.
// Output: assets/og-image.png. Upload to GitHub: Repo → Settings → Social preview.

// Self-bootstrap: when invoked under plain Node (e.g. `npm run og-image`),
// re-spawn under Electron with the env vars that force pure-Node mode stripped,
// matching the pattern in scripts/launch.js.
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
const HEIGHT = 640;
const OUT = path.join(__dirname, '..', 'assets', 'og-image.png');

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; width: ${WIDTH}px; height: ${HEIGHT}px;
    background: #181B20; color: #fff; overflow: hidden;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  .card { width: 100%; height: 100%; display: flex; flex-direction: row;
    box-sizing: border-box; padding: 72px; gap: 56px;
    background:
      radial-gradient(circle at 85% 15%, rgba(56,174,235,0.18) 0%, transparent 55%),
      radial-gradient(circle at 10% 100%, rgba(56,174,235,0.10) 0%, transparent 50%),
      #181B20; }
  .left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { color: #38AEEB; font-size: 22px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; margin-bottom: 18px; }
  .title { font-size: 76px; font-weight: 700; line-height: 1.05; margin: 0 0 24px; }
  .subtitle { font-size: 26px; line-height: 1.45; color: #C5CBD4; max-width: 560px; margin: 0; }
  .tags { display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap; }
  .tag { font-size: 16px; padding: 8px 16px; border-radius: 999px;
    background: rgba(56,174,235,0.12); color: #38AEEB; border: 1px solid rgba(56,174,235,0.35); }
  .footer { margin-top: 40px; font-size: 18px; color: #8892A0; }
  .right { width: 380px; display: flex; align-items: center; justify-content: center; }
  .widget { width: 320px; background: #1F2329; border: 1px solid #2A2F36;
    border-radius: 18px; padding: 26px; box-shadow: 0 30px 60px rgba(0,0,0,0.45); }
  .widget-head { display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; font-size: 14px; color: #8892A0; letter-spacing: 1px;
    text-transform: uppercase; }
  .pct { font-size: 56px; font-weight: 700; color: #fff; margin: 0 0 4px; }
  .label { font-size: 15px; color: #8892A0; margin-bottom: 22px; }
  .bar-wrap { background: #11141A; border-radius: 999px; height: 14px; overflow: hidden;
    margin-bottom: 14px; }
  .bar { height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #38AEEB, #6FD0FF); }
  .meta { display: flex; justify-content: space-between; font-size: 13px;
    color: #8892A0; margin-top: 18px; }
</style></head>
<body>
  <div class="card">
    <div class="left">
      <div class="eyebrow">Open Source · MIT</div>
      <h1 class="title">Claude Usage<br>Widget</h1>
      <p class="subtitle">Always-on-top desktop widget for your claude.ai plan usage. Real-time tracking, 7-day history, reset hooks.</p>
      <div class="tags">
        <span class="tag">Electron</span>
        <span class="tag">Windows · macOS · Linux</span>
        <span class="tag">Portable EXE</span>
      </div>
      <div class="footer">github.com/projectvelox/claude-usage-widget</div>
    </div>
    <div class="right">
      <div class="widget">
        <div class="widget-head"><span>Claude Pro</span><span>● live</span></div>
        <div class="pct">67%</div>
        <div class="label">Weekly limit · resets in 2d 14h</div>
        <div class="bar-wrap"><div class="bar" style="width:67%"></div></div>
        <div class="bar-wrap"><div class="bar" style="width:42%; background: linear-gradient(90deg, #5BC18B, #8FE0AF);"></div></div>
        <div class="meta"><span>5-hour</span><span>42%</span></div>
      </div>
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
  await new Promise(r => setTimeout(r, 300));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  const stat = fs.statSync(OUT);
  console.log(`Wrote ${OUT} (${WIDTH}x${HEIGHT}, ${stat.size} bytes)`);
  app.quit();
});
