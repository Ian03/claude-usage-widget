// Headless Electron -> assets/mascot-preview/*.png
//
// Loads assets/claw-d-states.html in a hidden BrowserWindow and captures
// PNGs of the full preview and each individual mood card at several animation
// phases. Lets Claude (or anyone reviewing) actually see what the production
// rendering looks like without running the desktop app.
//
// Usage:  node scripts/capture-mascot-preview.js
// Output: assets/mascot-preview/all-moods.png, ok-1.png ... paused-5.png

if (!process.versions.electron) {
  delete process.env.ELECTRON_RUN_AS_NODE;
  const { spawn } = require('child_process');
  const electronPath = require('electron');
  const child = spawn(electronPath, [__filename], { stdio: 'inherit', env: process.env });
  child.on('close', (code) => process.exit(code ?? 0));
  return;
}

delete process.env.ELECTRON_RUN_AS_NODE;
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'mascot-preview');
const WIDTH = 1400;
const HEIGHT = 900;
const PHASES_PER_CARD = 5;
const PHASE_DELAY_MS = 300;

app.disableHardwareAcceleration();

// EPIPE-proof logging: if stdout is closed (e.g., the script was launched in
// a backgrounded shell that buffered out), don't crash the Electron main
// process — just swallow.
const log = (...args) => { try { console.log(...args); } catch (_) {} };
process.stdout?.on?.('error', () => {});

async function capture() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a1d',
    webPreferences: { contextIsolation: true, nodeIntegration: false, offscreen: false },
  });

  await win.loadFile(path.join(__dirname, '..', 'assets', 'claw-d-states.html'));
  await new Promise((r) => setTimeout(r, 700));

  const full = await win.webContents.capturePage();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'all-moods.png'), full.toPNG());
  log('wrote all-moods.png');

  // Tightly-cropped grid for the README hero image. assets/claw-d.png is
  // NOT gitignored (mascot-preview/ is) so this one ships with the repo.
  const gridBox = await win.webContents.executeJavaScript(`
    (() => {
      const g = document.querySelector('.grid');
      const r = g.getBoundingClientRect();
      return {
        x: Math.max(0, Math.floor(r.x) - 24),
        y: Math.max(0, Math.floor(r.y) - 60),  // include the title above
        width:  Math.ceil(r.width) + 48,
        height: Math.ceil(r.height) + 80,
      };
    })();
  `);
  const gridImg = await win.webContents.capturePage(gridBox);
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'claw-d.png'), gridImg.toPNG());
  log('wrote ../assets/claw-d.png');

  const cards = await win.webContents.executeJavaScript(`
    Array.from(document.querySelectorAll('.card')).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        mood: el.dataset.mood,
        x: Math.floor(r.x), y: Math.floor(r.y),
        w: Math.ceil(r.width), h: Math.ceil(r.height),
      };
    });
  `);

  for (const card of cards) {
    for (let i = 1; i <= PHASES_PER_CARD; i++) {
      await new Promise((r) => setTimeout(r, PHASE_DELAY_MS));
      const img = await win.webContents.capturePage({
        x: card.x, y: card.y, width: card.w, height: card.h,
      });
      const filename = `${card.mood}-${i}.png`;
      fs.writeFileSync(path.join(OUTPUT_DIR, filename), img.toPNG());
      log(`wrote ${filename}`);
    }
  }

  app.quit();
}

app.whenReady().then(() => {
  capture().catch((e) => { console.error(e); app.quit(); });
});
