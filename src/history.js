const fs = require('fs');
const path = require('path');

// Append-only ring of usage samples. Trimmed to keep the file small.
// Stored next to config.json under userData.
const MAX_SAMPLES = 2016; // 7 days @ 5min spacing (288/day * 7)
const MIN_SPACING_MS = 60_000; // dedupe rapid polls into the same minute

class History {
  constructor(filePath) {
    this.filePath = filePath;
    this.samples = [];
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.samples)) this.samples = parsed.samples;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('History load failed:', err);
    }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({ samples: this.samples }));
    } catch (err) {
      console.error('History save failed:', err);
    }
  }

  add(usage) {
    if (!usage || !Array.isArray(usage.limits)) return;
    const t = usage.fetchedAt || Date.now();
    const last = this.samples[this.samples.length - 1];
    if (last && t - last.t < MIN_SPACING_MS) return; // dedupe
    const point = { t };
    for (const limit of usage.limits) {
      point[limit.id] = limit.utilization;
    }
    this.samples.push(point);
    // Trim by both age and count
    const cutoff = t - 7 * 24 * 60 * 60 * 1000;
    while (this.samples.length && this.samples[0].t < cutoff) this.samples.shift();
    while (this.samples.length > MAX_SAMPLES) this.samples.shift();
    this.save();
  }

  series(limitId, windowMs = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - windowMs;
    return this.samples
      .filter((s) => s.t >= cutoff && typeof s[limitId] === 'number')
      .map((s) => ({ t: s.t, v: s[limitId] }));
  }

  hasMeaningfulData() {
    return this.samples.length >= 2;
  }
}

module.exports = { History };
