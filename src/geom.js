// Pure geometry helpers, no Electron deps so they're unit-testable. Used by
// main.js to detect "the widget's saved position is on a monitor that's no
// longer connected" and snap it back to the primary display.

function rectsOverlap(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0;
}

function isOnAnyDisplay(rect, displays) {
  for (const d of displays) {
    if (rectsOverlap(rect, d.workArea)) return true;
  }
  return false;
}

module.exports = { rectsOverlap, isOnAnyDisplay };
