# Notesnook — AGENTS.md

A navigation guide for AI coding assistants working in this monorepo.

---

## Repository layout

```
notesnook/
├── apps/
│   ├── web/          — Vite + React SPA (primary web client)
│   ├── desktop/      — Electron wrapper around the web app
│   ├── mobile/       — React Native iOS + Android client
│   ├── monograph/    — Next.js server for public note rendering
│   ├── vericrypt/    — Standalone encryption verification tool
│   └── theme-builder/— Interactive theme editor
├── packages/
│   ├── core/         — ALL business logic, database, sync, crypto orchestration
│   ├── crypto/       — E2E encryption (XChaCha20-Poly1305, Argon2) over libsodium
│   ├── sodium/       — Platform-aware libsodium binding (WASM browser / native Node)
│   ├── editor/       — Tiptap 2 rich-text editor + 30+ custom extensions
│   ├── editor-mobile/— Mobile web-view bundle of the editor
│   ├── common/       — Shared React hooks, utilities, and DB singleton
│   ├── theme/        — Emotion + Theme UI design tokens
│   ├── intl/         — LinguiJS compiled i18n catalogs
│   ├── logger/       — Pluggable logger
│   ├── streamable-fs/— Chunked IndexedDB virtual filesystem for attachments
│   └── clipper/      — DOM serialiser for web clipping
├── extensions/
│   └── web-clipper/  — Chrome/Firefox browser extension
├── servers/
│   └── themes/       — Themes distribution server
└── scripts/          — execute.mjs (tx runner), bootstrap.mjs, build.mjs
```

---

## Core subsystem entry points

| What you're looking for | Where to start |
|---|---|
| Business logic / data access | `packages/core/src/api/index.ts` (`Database` class) |
| Entity collections (notes, notebooks, …) | `packages/core/src/collections/` |
| Database setup (Kysely, SQL schema) | `packages/core/src/database/index.ts` |
| Sync engine | `packages/core/src/api/sync/index.ts` |
| Encryption key management | `packages/core/src/api/key-manager.ts`, `vault.ts` |
| Auth / user management | `packages/core/src/api/user-manager.ts` |
| Data types / entity shapes | `packages/core/src/types.ts` |
| Platform adapter interfaces | `packages/core/src/interfaces.ts` |
| Editor extensions | `packages/editor/src/extensions/` |
| Web app stores (state) | `apps/web/src/stores/` |
| Desktop IPC router | `apps/desktop/src/api/` |

---

## Key patterns to know

### Platform adapter injection

`@notesnook/core` is platform-agnostic. The `Database` class receives `IStorage`, `IFileStorage`, and `ICompressor` implementations via constructor injection. Each platform (`web`, `desktop`, `mobile`) supplies its own adapters. The singleton used by web + desktop is in `packages/common/src/database.ts`.

### Kysely fork

The project uses `@streetwriters/kysely` — a Notesnook-maintained fork of Kysely that supports both `better-sqlite3` (Node/Electron) and an IndexedDB-backed dialect (web/mobile). Import it from this package, not from `kysely` directly.

### `npm run tx` task runner

All cross-workspace commands use `scripts/execute.mjs` exposed as `npm run tx <workspace>:<script>`. For example, `npm run tx web:build`. Do not attempt to `cd` into individual packages and run npm scripts directly when workspace orchestration is needed.

### Sync uses SignalR

The sync transport is Microsoft SignalR (WebSockets with fallback). The collector encrypts local changes before sending; the merger decrypts incoming remote items. Conflict resolution is last-write-wins by `dateModified`.

### Commit requirements

All commits must be signed off with `Signed-off-by` (DCO). commitlint enforces conventional commit message format. Hooks are installed via Husky on `npm run bootstrap`.

### No Yarn / PNPM

The project explicitly uses npm workspaces only. Do not introduce Yarn or PNPM commands.

---

## Repo-specific tooling

| Tool / Script | Location | Purpose |
|---|---|---|
| `tx` runner | `scripts/execute.mjs` | Cross-workspace task execution |
| `bootstrap` | `scripts/bootstrap.mjs` | Workspace setup (run after clone) |
| `build` | `scripts/build.mjs` | Library build orchestration |
| `clean` | `scripts/clean.mjs` | Clean dist artifacts |
| `tsdown.config.ts` | root | Package bundler config (libraries) |
| `fastlane/` | root | Mobile release automation |

---

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `core.tests.yml` / `web.tests.yml` / `editor.tests.yml` — automated test runs
- `web.preview.yml` / `desktop.preview.yml` / `android.preview.firebase.yml` — PR preview builds
- `web.publish.yml` / `desktop.publish.yml` / `ios.publish.yml` / `android.publish.yml` — release pipelines

---

## Detailed documentation

Full structured documentation is in `.agents/summary/`:

- `index.md` — knowledge base index (start here for deeper questions)
- `architecture.md` — layered architecture and encryption scheme
- `components.md` — file-by-file component breakdown
- `interfaces.md` — all public APIs and adapter contracts
- `data_models.md` — entity type definitions and schemas
- `workflows.md` — sync, auth, backup, and release workflows
- `dependencies.md` — external library inventory
- `review_notes.md` — known documentation gaps

---

## Custom Instructions

<!-- This section is maintained by developers and agents during day-to-day work.
     It is NOT auto-generated by codebase-summary and MUST be preserved during refreshes.
     Add project-specific conventions, gotchas, and workflow requirements here. -->

### Setup and Build

**Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making changes.** The key setup step is:

```
npm run bootstrap
```

Run this from the **repo root** before building or testing anything. It installs all package
dependencies (each package has its own `node_modules`) and rebuilds native modules. Do NOT
manually `npm install` inside individual packages or try to build them out of order — bootstrap
handles the dependency graph automatically.

### Adding a new package

When adding a new package under `packages/` or `apps/`:
1. Create `package.json` following an existing package as a template.
2. Add the package path to the `scopes` map in `scripts/bootstrap.mjs` if it needs a named scope.
3. Run `npm run bootstrap` from the repo root to install its dependencies.
4. Use `node ../../scripts/build.mjs` for library builds (produces CJS + ESM + types).
5. For standalone executables (e.g. MCP server), use `tsc` directly with `"module": "NodeNext"`.

### Native module compilation (arm64 macOS)

`better-sqlite3-multiple-ciphers` v11.5.0 fails to compile on arm64 macOS because `sqlite3.gyp`
passes `-maes`/`-msse4.2` via `xcode_settings.OTHER_CFLAGS` without stripping them for arm64
(the `cflags!` conditions only strip from `cflags`, not `xcode_settings`). The fix is to add a
matching `xcode_settings` override inside the `target_arch=="arm64"` condition block. A
`patch-package` patch at `packages/mcp/patches/` covers the `packages/mcp` copy.
