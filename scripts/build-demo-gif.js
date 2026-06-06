// Headless Electron + gifenc → assets/demo.gif.
//
// We load renderer/demo.html (a self-contained, IPC-free clone of the widget
// driven by a scripted timeline), drive the timeline via window.setFrameTime,
// capture each frame with webContents.capturePage(), and assemble into a
// looping GIF. The result is the exact production widget rendering, not a
// mockup — so what users see in the README is what they get after install.

// Self-launch under the real Electron runtime if we were invoked as plain Node.
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
const DURATION_S = 6;
const TOTAL_FRAMES = FPS * DURATION_S;
const FRAME_INTERVAL_MS = 1000 / FPS;
const WIDTH = 340;
const HEIGHT = 360;

const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'demo.gif');

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

  await win.loadFile(path.join(__dirname, '..', 'renderer', 'demo.html'));
  // Give layout + fonts a beat to settle.
  await new Promise((r) => setTimeout(r, 500));

  const frames = [];
  console.log(`Capturing ${TOTAL_FRAMES} frames at ${FPS} fps…`);
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const t = i / FPS;
    await win.webContents.executeJavaScript(`window.setFrameTime(${t});`);
    // Two animation frames so the CSS transitions tick.
    await new Promise((r) => setTimeout(r, 40));
    const img = await win.webContents.capturePage();
    const size = img.getSize();
    const bgra = img.getBitmap(); // Buffer, BGRA on Windows
    const rgba = bgraToRgba(bgra);
    frames.push({ rgba, width: size.width, height: size.height });
    if (i % 10 === 0) process.stdout.write(`  frame ${i}/${TOTAL_FRAMES}\r`);
  }
  console.log(`  frame ${TOTAL_FRAMES}/${TOTAL_FRAMES}  `);

  win.destroy();

  // gifenc is ESM-only — load via dynamic import from this CJS file.
  // This installed version wraps everything under .default.
  const gifenc = await import('gifenc');
  const { GIFEncoder, quantize, applyPalette } = gifenc.default || gifenc;

  const encoder = GIFEncoder();
  // Single shared palette derived from the first frame — keeps file small
  // and avoids palette flicker. The widget's color set is small enough that
  // 64 entries handles the gradient + accent + state colors comfortably.
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
}

function bgraToRgba(bgra) {
  const out = Buffer.alloc(bgra.length);
  for (let i = 0; i < bgra.length; i += 4) {
    out[i] = bgra[i + 2];     // R
    out[i + 1] = bgra[i + 1]; // G
    out[i + 2] = bgra[i];     // B
    out[i + 3] = bgra[i + 3]; // A
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
