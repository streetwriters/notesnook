---
title: Codebase Info
description: Basic metadata about the Notesnook monorepo
---

# Notesnook — Codebase Info

- **Project**: Notesnook
- **License**: GPL-3.0-or-later
- **Organization**: Streetwriters (Private) Limited
- **Languages**: TypeScript (primary), JavaScript, React/JSX, React Native
- **Package manager**: npm (workspaces monorepo — Yarn/PNPM explicitly not used)
- **Build runner**: custom `scripts/execute.mjs` aliased as `npm run tx`

## Package inventory

| Package / App | npm name | Path |
|---|---|---|
| Core library | `@notesnook/core` | `packages/core` |
| Crypto library | `@notesnook/crypto` | `packages/crypto` |
| Sodium wrapper | `@notesnook/sodium` | `packages/sodium` |
| Rich-text editor | `@notesnook/editor` | `packages/editor` |
| Mobile editor wrapper | `@notesnook/editor-mobile` | `packages/editor-mobile` |
| Shared UI / hooks | `@notesnook/common` | `packages/common` |
| Theme system | `@notesnook/theme` | `packages/theme` |
| Logger | `@notesnook/logger` | `packages/logger` |
| Streaming FS | `@notesnook/streamable-fs` | `packages/streamable-fs` |
| i18n / intl | `@notesnook/intl` | `packages/intl` |
| Web clipper core | `@notesnook/clipper` | `packages/clipper` |
| Web app | `@notesnook/web` | `apps/web` |
| Desktop app | `@notesnook/desktop` | `apps/desktop` |
| Mobile app | `@notesnook/mobile` | `apps/mobile` |
| Monograph (publish) | — | `apps/monograph` |
| Vericrypt | `@notesnook/vericrypt` | `apps/vericrypt` |
| Theme builder | — | `apps/theme-builder` |
| Browser extension | `@notesnook/web-clipper` | `extensions/web-clipper` |
| Themes server | — | `servers/themes` |

## Key config files

- `tsconfig.json` — root TypeScript config (target: ES2016, strict mode)
- `tsdown.config.ts` — library build config
- `.husky/` — git hooks (lint, commitlint)
- `.github/workflows/` — CI/CD pipelines (web, desktop, mobile, monograph, vericrypt, themes)
- `scripts/execute.mjs` — workspace task runner (`tx`)
- `scripts/bootstrap.mjs` — workspace setup script
