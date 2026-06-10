// In-app update check. Polls the GitHub Releases API for the latest published
// release tag (vMAJOR.MINOR.PATCH) and compares it to the running app version.
// We don't auto-download — the renderer just surfaces a "v0.2.11 available"
// link that opens the release page in the user's browser. This keeps the
// portable EXE actually portable (no self-rewrite) and avoids SmartScreen
// re-prompts that would come with electron-updater on an unsigned build.

const RELEASES_URL = 'https://api.github.com/repos/projectvelox/claude-usage-widget/releases/latest';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day
const REQUEST_TIMEOUT_MS = 8_000;

async function fetchLatestRelease() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(RELEASES_URL, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'claude-usage-widget',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      // 403 means we hit the unauthenticated rate limit (60/h per IP). Not an
      // error worth surfacing — just skip this cycle and try again tomorrow.
      const err = new Error(`GitHub returned ${res.status}`);
      err.code = res.status === 403 ? 'RATE_LIMITED' : 'HTTP_ERROR';
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function parseVersion(tag) {
  if (typeof tag !== 'string') return null;
  const m = tag.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// Returns negative if a < b, 0 if equal, positive if a > b. Pre-release/build
// metadata is dropped on parse — we only ship plain X.Y.Z tags, so this is fine.
function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

async function checkForUpdate(currentVersion) {
  const current = parseVersion(currentVersion);
  if (!current) return { available: false, reason: 'bad-current-version' };

  const release = await fetchLatestRelease();
  const latest = parseVersion(release.tag_name);
  if (!latest) return { available: false, reason: 'bad-remote-tag', remoteTag: release.tag_name };

  const available = compareVersions(latest, current) > 0;
  // Build the release URL from the tag we just validated instead of trusting
  // `release.html_url`. If the GitHub response were ever tampered with (MITM,
  // mirror compromise), an attacker could phish the user via a spoofed link.
  // The hardcoded host means `shell:openExternal` only ever opens our repo.
  const tag = release.tag_name.replace(/^v/i, '');
  return {
    available,
    currentVersion,
    latestVersion: tag,
    releaseUrl: `https://github.com/projectvelox/claude-usage-widget/releases/tag/v${tag}`,
    publishedAt: release.published_at || null,
    checkedAt: Date.now(),
  };
}

module.exports = { checkForUpdate, parseVersion, compareVersions, CHECK_INTERVAL_MS };
