// Renders assets/settings.png — the actual settings.html panel, with
// realistic values pre-populated, so the README can show what users
// can actually customize.
//
// Loads the real renderer/settings.html via loadFile (so settings.css
// is applied unchanged) but stubs window.api before settings.js runs,
// so the form populates from a hardcoded "showcase" config instead of
// erroring out on the missing IPC bridge.

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
const HEIGHT = 1800; // generous; final window is resized to content height (capped <2000px)
const OUT = path.join(__dirname, '..', 'assets', 'settings.png');

const SHOWCASE_CFG = {
  layout: 'expanded',
  alwaysOnTop: true,
  clickThrough: false,
  showHeader: true,
  showResetCountdown: true,
  showPaceMarker: true,
  showStaleIndicator: true,
  theme: 'dark',
  accentColor: '#38AEEB',
  opacity: 0.96,
  cornerRadius: 14,
  fontScale: 1.0,
  fontFamily: 'system',
  blur: true,
  trayIconStyle: 'dynamic',
  showHistoryGraph: true,
  historyLimitId: 'seven_day',
  thresholds: { warn: 75, critical: 90 },
  colors: { ok: '#3DDC84', warn: '#F5B400', critical: '#E5484D' },
  notifyAtWarn: false,
  notifyAtCritical: true,
  onReset: { five_hour: '', seven_day: '', seven_day_sonnet: '', seven_day_opus: '' },
  openAtLogin: false,
  openMinimized: false,
};

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    useContentSize: true,
    webPreferences: { offscreen: true },
  });

  await win.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));

  // Two-column layout — keeps the PNG under 2000px tall and gives the
  // showcase a more screenshot-friendly aspect ratio.
  await win.webContents.insertCSS(`
    html, body { overflow: hidden; }
    main {
      max-width: none !important;
      width: auto !important;
      column-count: 2;
      column-gap: 36px;
      padding: 24px 32px 28px !important;
    }
    main > h1, main > .subtitle { column-span: all; }
    section { break-inside: avoid; -webkit-column-break-inside: avoid; page-break-inside: avoid; }
  `);

  // settings.js threw on the missing window.api — populate the form directly.
  await win.webContents.executeJavaScript(`
    (function() {
      const cfg = ${JSON.stringify(SHOWCASE_CFG)};
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
      const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

      setVal('layout', cfg.layout);
      setCheck('alwaysOnTop', cfg.alwaysOnTop);
      setCheck('clickThrough', cfg.clickThrough);
      setCheck('showHeader', cfg.showHeader);
      setCheck('showResetCountdown', cfg.showResetCountdown);
      setCheck('showPaceMarker', cfg.showPaceMarker);
      setCheck('showStaleIndicator', cfg.showStaleIndicator);

      setVal('theme', cfg.theme);
      setVal('accentColor', cfg.accentColor);
      setVal('opacity', cfg.opacity); setText('opacityVal', Math.round(cfg.opacity * 100) + '%');
      setVal('cornerRadius', cfg.cornerRadius); setText('cornerRadiusVal', cfg.cornerRadius + 'px');
      setVal('fontScale', cfg.fontScale); setText('fontScaleVal', Math.round(cfg.fontScale * 100) + '%');
      setVal('fontFamily', cfg.fontFamily);
      setCheck('blur', cfg.blur);

      setVal('trayIconStyle', cfg.trayIconStyle);

      setCheck('showHistoryGraph', cfg.showHistoryGraph);
      setVal('historyLimitId', cfg.historyLimitId);

      setVal('warn', cfg.thresholds.warn);
      setVal('critical', cfg.thresholds.critical);
      setVal('okColor', cfg.colors.ok);
      setVal('warnColor', cfg.colors.warn);
      setVal('criticalColor', cfg.colors.critical);

      setCheck('notifyAtWarn', cfg.notifyAtWarn);
      setCheck('notifyAtCritical', cfg.notifyAtCritical);

      setVal('onReset_five_hour', "powershell -c \\"New-BurntToastNotification -Text 'Session reset'\\"");
      setVal('onReset_seven_day', '');
      setVal('onReset_seven_day_sonnet', '');
      setVal('onReset_seven_day_opus', '');

      setCheck('openAtLogin', cfg.openAtLogin);
      setCheck('openMinimized', cfg.openMinimized);
    })();
  `);

  // Wait for paint and resize the window to match the natural content height
  // so the screenshot isn't padded with empty space at the bottom.
  await new Promise(r => setTimeout(r, 400));
  const contentH = await win.webContents.executeJavaScript(`
    document.documentElement.scrollHeight
  `);
  const finalH = Math.min(HEIGHT, contentH + 16);
  win.setContentSize(WIDTH, finalH);
  await new Promise(r => setTimeout(r, 200));

  const img = await win.webContents.capturePage();
  fs.writeFileSync(OUT, img.toPNG());
  const stat = fs.statSync(OUT);
  console.log(`Wrote ${OUT} (${WIDTH}x${finalH}, ${stat.size} bytes)`);
  app.quit();
});
