# Contributing

Thanks for considering a contribution. Issues, fixes, and feature PRs are all welcome.

## Dev setup

```powershell
git clone https://github.com/projectvelox/claude-usage-widget
cd claude-usage-widget
npm install
npm start
```

You need Node 18+ and [Claude Code](https://claude.com/claude-code) installed and logged in, so that `~/.claude/.credentials.json` exists with a `claudeAiOauth.accessToken` field. The widget uses that token to call Anthropic's usage endpoint — there is no separate login.

## Running tests

```powershell
npm test
```

There are snapshot tests in `tests/normalize.test.js` covering the response-shape parser. If you change `src/usage.js`, please add or update tests against the fixture there.

## Project layout

```
src/
  main.js       Electron main process, IPC, tray, login items, reset hooks
  preload.js    Sandboxed bridge between renderer and main
  usage.js      OAuth Bearer fetch, normalize, auth-retry on 401
  poller.js     Adaptive polling, reset detection, backoff
  history.js    Append-only sample store, 7-day trim
  config.js     Persisted settings + deep merge
  icon.js       Pure-Node PNG encoder + 4 tray icon styles + dynamic gauge
renderer/
  widget.html / .css / .js     Always-on-top floating widget + SVG history graph
  settings.html / .css / .js   Live-editing settings panel
  demo.html                    Self-contained widget clone for GIF capture
tests/
  normalize.test.js   Snapshot tests against the live response shape
scripts/
  launch.js          Strips ELECTRON_RUN_AS_NODE before spawning the GUI
  build-icon.js      Pre-bakes tray + window + preview icons
  build-demo-gif.js  Headless Electron capture + gifenc → assets/demo.gif
```

## Coding style

- **No new comments unless they explain WHY**, not WHAT. Well-named identifiers carry the WHAT.
- Prefer editing existing files over adding new ones unless a clear seam exists.
- Don't add error handling for impossible cases (we validate at system boundaries only — the OAuth fetch, the credentials read, the user shell command).
- No backwards-compatibility shims for v0.x — just change the code.

## Pull requests

1. Open an issue first for non-trivial features so we can agree on direction before you write code.
2. Keep PRs focused. A single PR that fixes a bug AND refactors the surrounding code is harder to review than two PRs.
3. Update or add tests when you change parsing, polling, or config code.
4. If you add a new cosmetic option, surface it in both the tray menu (where it makes sense) and the settings panel.

## Releasing (maintainers)

We use GitHub Actions to build release artifacts. To cut a release:

1. Bump the version in `package.json` and commit.
2. Tag: `git tag v0.x.y && git push origin v0.x.y`.
3. The `Release` workflow builds the Windows portable EXE, computes the SHA-256, and attaches everything to a draft GitHub release. Edit the draft to add the changelog, then publish.

## What we will not merge

- Telemetry, analytics, or any code that sends data to anywhere other than `api.anthropic.com`.
- Auto-update fetching code that targets any host other than `github.com`.
- Cookie-scraping or DPAPI-based auth as a primary path (it's been tried; it breaks).
- Packaging that bundles unrelated software ("free toolbars" etc.).
