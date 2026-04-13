---
title: Knowledge Base Index
description: Primary index for AI assistants navigating Notesnook documentation
---

# Notesnook — Knowledge Base Index

## How to use this index

This file is the primary entry point for AI assistants. Read it first; it contains enough metadata to determine which document to open next without reading all files.

| Question type | Best document |
|---|---|
| "Where is X code located?" | `codebase_info.md`, then `components.md` |
| "How does the architecture work?" | `architecture.md` |
| "What does component/package X do?" | `components.md` |
| "What interfaces must I implement?" | `interfaces.md` |
| "What does data type X look like?" | `data_models.md` |
| "How does sync / auth / backup work?" | `workflows.md` |
| "What external libraries are used?" | `dependencies.md` |
| "What gaps exist in this documentation?" | `review_notes.md` |

---

## Document summaries

### `codebase_info.md`
Complete package inventory (18 packages/apps), language stack (TypeScript/React/React Native/Electron), build tooling (`npm run tx` task runner), and config file locations.

### `architecture.md`
Layered architecture diagram (UI → API → Collections → Database → Crypto), E2E encryption scheme (XChaCha20-Poly1305 + Argon2), platform-agnostic core design via dependency injection, and SQL-first storage approach using a forked Kysely.

### `components.md`
File-by-file breakdown of all major subsystems:
- `packages/core/src/api/` — Database class, sync engine, vault, user/auth management
- `packages/core/src/collections/` — all entity collection classes
- `packages/core/src/database/` — Kysely setup, backup, FTS, migrations
- `packages/editor` — Tiptap extensions, toolbar, hooks
- `apps/web`, `apps/desktop`, `apps/mobile` directory maps
- `apps/monograph`, `apps/vericrypt`, `extensions/web-clipper`

### `interfaces.md`
All platform adapter interfaces (`IStorage`, `IFileStorage`, `ICompressor`), the full public API surface of the `Database` class, sync protocol (SignalR sequence), desktop IPC (electron-trpc), crypto API, web extension messaging, theme and i18n APIs.

### `data_models.md`
UML class diagram for all entity types (Note, Notebook, Tag, Color, Attachment, ContentItem, Reminder, Vault, Shortcut, Relation, Monograph), soft-delete model (`MaybeDeletedItem`), sort/group options, cipher types, file encryption metadata, backup file format.

### `workflows.md`
Sequence diagrams for: note creation/editing, sync cycle, authentication, attachment upload, backup/restore, monograph publishing. Also covers the vault workflow and the full build/release pipeline with CI workflow file mapping.

### `dependencies.md`
Key external libraries per package, with roles. Notable: `@streetwriters/kysely` (Notesnook fork), `@microsoft/signalr` (sync), `@tiptap` ecosystem (editor), `electron-trpc` (desktop IPC), `detox` (mobile E2E), Lingui (i18n).

### `review_notes.md`
Known documentation gaps: mobile app internals, desktop IPC router procedures, SQL column-level schema, test infrastructure, theme tokens, CI environment variables, streamable-fs internals.

---

## Codebase quick-reference

```
notesnook/
├── apps/
│   ├── web/          @notesnook/web       — Vite React SPA
│   ├── desktop/      @notesnook/desktop   — Electron wrapper
│   ├── mobile/       @notesnook/mobile    — React Native iOS/Android
│   ├── monograph/                         — Next.js public note renderer
│   ├── vericrypt/    @notesnook/vericrypt — Encryption verifier
│   └── theme-builder/                     — Theme editor
├── packages/
│   ├── core/         @notesnook/core      — ALL business logic, sync, DB
│   ├── crypto/       @notesnook/crypto    — E2E encryption wrapper
│   ├── sodium/       @notesnook/sodium    — libsodium binding
│   ├── editor/       @notesnook/editor    — Tiptap rich-text editor
│   ├── editor-mobile/                     — Mobile editor bundle
│   ├── common/       @notesnook/common    — Shared hooks + DB singleton
│   ├── theme/        @notesnook/theme     — Design tokens + Emotion
│   ├── intl/         @notesnook/intl      — LinguiJS catalogs
│   ├── logger/       @notesnook/logger    — Pluggable logger
│   ├── streamable-fs/                     — IndexedDB streaming FS
│   └── clipper/      @notesnook/clipper   — Web clipper DOM serialiser
├── extensions/
│   └── web-clipper/  @notesnook/web-clipper — Browser extension
├── servers/
│   └── themes/                            — Themes distribution server
└── scripts/          execute.mjs, bootstrap.mjs, build.mjs …
```
