# Pointscanner — notes for Claude

Before any UI, copy, or data-handling work, read docs/DESIGN_GUIDELINES.md and follow it.

- Architecture, data model and decisions: docs/HANDOFF.md
- Live-data collector status and ground rules: docs/LIVE_DATA.md
- Latest design & compliance audit: docs/DESIGN_AUDIT.md
- After editing anything under assets/, run `node build.mjs` and commit dist/. CI runs `node build.mjs --check` and `npm test`.
