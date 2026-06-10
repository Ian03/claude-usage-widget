const test = require('node:test');
const assert = require('node:assert/strict');
const { rectsOverlap, isOnAnyDisplay } = require('../src/geom');

// Models the screen.Display.workArea field — only the fields the helper uses.
const display = (x, y, width, height) => ({ workArea: { x, y, width, height } });
const primary = display(0, 0, 1920, 1040);
const secondary = display(1920, 0, 2560, 1440); // to the right of primary

test('rectsOverlap detects overlapping rects', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 }), true);
});

test('rectsOverlap returns false for touching-but-not-overlapping rects', () => {
  // Edge-touching shouldn't count — a window pinned exactly to the seam
  // between two monitors would otherwise be "valid" but invisible.
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 100, y: 0, width: 100, height: 100 }), false);
});

test('rectsOverlap returns false for fully disjoint rects', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 500, y: 500, width: 100, height: 100 }), false);
});

test('isOnAnyDisplay: widget on primary is visible', () => {
  const widget = { x: 100, y: 100, width: 280, height: 320 };
  assert.equal(isOnAnyDisplay(widget, [primary, secondary]), true);
});

test('isOnAnyDisplay: widget on secondary is visible', () => {
  // 2nd monitor at x=1920..4480; widget pinned at x=3545 lives here.
  const widget = { x: 3545, y: 184, width: 280, height: 320 };
  assert.equal(isOnAnyDisplay(widget, [primary, secondary]), true);
});

test('isOnAnyDisplay: same widget orphaned when secondary disconnects', () => {
  // The bug we're fixing: x=3545 is way past primary's right edge (1920).
  // After unplug, with only primary present, this rect has zero overlap.
  const widget = { x: 3545, y: 184, width: 280, height: 320 };
  assert.equal(isOnAnyDisplay(widget, [primary]), false);
});

test('isOnAnyDisplay: widget straddling primary/secondary still counts as visible', () => {
  // Partial overlap with primary is enough — we don't force full containment,
  // since users sometimes drag the widget half-off on purpose.
  const widget = { x: 1850, y: 100, width: 280, height: 320 };
  assert.equal(isOnAnyDisplay(widget, [primary, secondary]), true);
});

test('isOnAnyDisplay: returns false when no displays are connected', () => {
  // Defensive — shouldn't happen in practice (Electron always reports >= 1),
  // but guards against the helper returning a meaningless true from an empty
  // loop.
  assert.equal(isOnAnyDisplay({ x: 0, y: 0, width: 100, height: 100 }, []), false);
});
