const fs = require('fs');
const path = require('path');
const icon = require('../src/icon');

const ASSETS = path.join(__dirname, '..', 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

function write(name, size, style, opts = {}) {
  const c = icon.draw(style, size, opts);
  const png = icon.encodePNG(c.w, c.h, c.buf);
  const out = path.join(ASSETS, name);
  fs.writeFileSync(out, png);
  console.log(`Wrote ${out} (${size}x${size}, ${png.length} bytes)`);
}

// Primary tray + window icons
write('tray.png', 32, 'bars');
write('tray@2x.png', 64, 'bars');
write('icon.png', 256, 'bars');

// Per-style preview thumbnails (handy for README and quick visual comparison)
write('preview-bars.png', 128, 'bars');
write('preview-battery.png', 128, 'battery', { pct: 65 });
write('preview-gauge.png', 128, 'gauge', { pct: 65 });
write('preview-minimal.png', 128, 'minimal');
