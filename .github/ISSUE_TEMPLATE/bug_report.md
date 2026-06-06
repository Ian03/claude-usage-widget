---
name: Bug report
about: Something is broken or behaving unexpectedly.
title: '[bug] '
labels: bug
assignees: ''
---

**What happened**

A clear description of the actual behavior.

**What you expected**

A clear description of what should have happened instead.

**Steps to reproduce**

1.
2.
3.

**Environment**

- Widget version: (from `package.json` or About section)
- Windows version: (e.g., Windows 11 Pro 24H2)
- DPI scaling: (100% / 125% / 150% / 200%)
- Display config: (single monitor / multi-monitor)
- Installed via: (portable EXE / `npm start` / built locally)
- Claude Code installed and logged in: yes / no
- Subscription tier (Pro/Max/etc., if you're comfortable sharing):

**Logs / screenshots**

- Open DevTools on the widget (right-click → Inspect, if running from source) and paste any console errors.
- For the packaged EXE, run from a terminal and paste stderr.
- Screenshots of the widget at the moment of the bug are very helpful.

**Sensitive data**

The widget should never log your OAuth token or anything from `~/.claude/.credentials.json`. If you see one in the logs, please **redact it before posting** and flag it as a security issue per [SECURITY.md](../../SECURITY.md).
