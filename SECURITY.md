# Security Policy

## What this app touches

Claude Usage Widget reads one local file on your machine: `~/.claude/.credentials.json` (created and maintained by [Claude Code](https://claude.com/claude-code)). It uses the `claudeAiOauth.accessToken` field from that file to make HTTP requests to **only one endpoint**:

- `https://api.anthropic.com/api/oauth/usage` — Anthropic's official rate-limit usage endpoint.

That is the entire network surface. No telemetry. No analytics. No third-party hosts. No keys, tokens, or usage data ever leave your machine outside this single call.

## What we deliberately do not do

- We do not scrape `claude.ai` cookies or use Cloudflare-protected session tokens.
- We do not call any third-party API or CDN at runtime.
- We do not log, write to disk, or send the OAuth token anywhere except the `Authorization: Bearer ...` header on the request above.
- We do not ship binaries that auto-update from any source other than GitHub Releases over HTTPS (and only if you opt in to a future auto-update channel).

## What is stored on disk

| Path | Contents |
|---|---|
| `%APPDATA%\claude-usage-widget\config.json` | Your UI preferences (theme, opacity, thresholds, layout choices, reset-hook commands you set yourself). No tokens. |
| `%APPDATA%\claude-usage-widget\history.json` | A rolling 7-day series of utilization percentages and reset timestamps. No tokens, no message contents. |

## Reset-hook shell commands

The Settings panel lets you configure shell commands that run when a quota resets. Those commands are stored verbatim in `config.json` and executed as `spawn(command, { shell: true, detached: true, stdio: 'ignore' })` with these extra environment variables:

```
CLAUDE_RESET_ID
CLAUDE_RESET_LABEL
CLAUDE_RESET_AT
CLAUDE_RESET_PREVIOUS_UTIL
```

Only you can set these commands. They run with your user's privileges. Treat them as you would any other shell snippet you write.

## Reporting a vulnerability

If you find a security issue:

1. **Do not open a public GitHub issue.**
2. Open a [private security advisory](https://github.com/projectvelox/claude-usage-widget/security/advisories/new) on this repository, or
3. Email the maintainer (see [package.json](package.json) `author` field).

We aim to acknowledge reports within 72 hours and ship a fix or mitigation within 14 days for confirmed issues.

## Supply-chain note

This project depends on Electron, electron-builder, gifenc, and Node's standard library. We pin major versions in [package.json](package.json) and commit [package-lock.json](package-lock.json) for reproducible installs. We do **not** use any package that downloads or executes remote code at install time beyond Electron's own postinstall (which fetches the Electron binary from the official `https://github.com/electron/electron` releases).
