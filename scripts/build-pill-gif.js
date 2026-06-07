// Headless Electron + gifenc → assets/demo-pill.gif.
// Same pattern as build-demo-gif.js, but loads renderer/demo-pill.html so
// the README can show the minimal/pill mode in motion.

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

const FPS = 15;
const DURATION_S = 5.5;
const TOTAL_FRAMES = Math.round(FPS * DURATION_S);
const FRAME_INTERVAL_MS = 1000 / FPS;
const WIDTH = 360;
const HEIGHT = 180;

const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'demo-pill.gif');

app.disableHardwareAcceleration();

async function buildGif() {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#1f3144',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      offscreen: false,
    },
  });

  await win.loadFile(path.join(__dirname, '..', 'renderer', 'demo-pill.html'));
  await new Promise((r) => setTimeout(r, 500));

  const frames = [];
  console.log(`Capturing ${TOTAL_FRAMES} frames at ${FPS} fps…`);
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / FPS;
    await win.webContents.executeJavaScript(`window.setFrameTime(${t});`);
    await new Promise((r) => setTimeout(r, 40));
    const img = await win.webContents.capturePage();
    const size = img.getSize();
    const bgra = img.getBitmap();
    const rgba = bgraToRgba(bgra);
    frames.push({ rgba, width: size.width, height: size.height });
    if (i % 10 === 0) process.stdout.write(`  frame ${i}/${TOTAL_FRAMES}\r`);
  }
  console.log(`  frame ${TOTAL_FRAMES}/${TOTAL_FRAMES}  `);

  // Encode + write FIRST, then close the window. Electron 39 sometimes
  // crashes during the post-capture JS-execution scope teardown if the
  // window is destroyed while gifenc is being dynamically imported.
  const gifenc = await import('gifenc');
  const { GIFEncoder, quantize, applyPalette } = gifenc.default || gifenc;

  const encoder = GIFEncoder();
  const palette = quantize(frames[0].rgba, 128, { format: 'rgb444' });

  for (const frame of frames) {
    const index = applyPalette(frame.rgba, palette);
    encoder.writeFrame(index, frame.width, frame.height, {
      palette,
      delay: Math.round(FRAME_INTERVAL_MS),
      transparent: false,
    });
  }
  encoder.finish();

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, encoder.bytes());
  const kb = (encoder.bytes().length / 1024).toFixed(0);
  console.log(`Wrote ${OUTPUT_PATH} (${WIDTH}x${HEIGHT}, ${TOTAL_FRAMES} frames, ${kb} KB)`);

  if (!win.isDestroyed()) win.destroy();
}

function bgraToRgba(bgra) {
  const out = Buffer.alloc(bgra.length);
  for (let i = 0; i < bgra.length; i += 4) {
    out[i] = bgra[i + 2];
    out[i + 1] = bgra[i + 1];
    out[i + 2] = bgra[i];
    out[i + 3] = bgra[i + 3];
  }
  return out;
}

app.whenReady().then(async () => {
  try {
    await buildGif();
    app.exit(0);
  } catch (err) {
    console.error('GIF build failed:', err);
    app.exit(1);
  }
});
