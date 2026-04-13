---
title: Dependencies
description: Key external dependencies and their roles across the monorepo
---

# Dependencies

## Core library (`packages/core`)

| Dependency | Role |
|---|---|
| `@streetwriters/kysely` | Type-safe SQL query builder (fork of Kysely) |
| `@microsoft/signalr` | WebSocket-based sync transport |
| `@notesnook/crypto` | E2E encryption (internal) |
| `async-mutex` | Mutex for sync critical sections |
| `html-to-text` | HTML → plain text for content preview |
| `katex` | LaTeX math rendering in notes |

## Crypto (`packages/crypto`)

| Dependency | Role |
|---|---|
| `@notesnook/sodium` | libsodium binding (internal) |

## Sodium (`packages/sodium`)

| Dependency | Role |
|---|---|
| `libsodium-wrappers` | WASM libsodium for browser/mobile |
| Native Node bindings | For Electron/server (conditionally loaded) |

## Editor (`packages/editor`)

| Dependency | Role |
|---|---|
| `@tiptap/core` + ecosystem | ProseMirror-based rich text editor |
| `@tiptap/react` | React integration |
| `katex` | Math extension rendering |
| `highlight.js` | Code block syntax highlighting |

## Web app (`apps/web`)

| Dependency | Role |
|---|---|
| `react`, `react-dom` | UI framework |
| `@theme-ui/components` | Themed UI primitives |
| `@emotion/react` | CSS-in-JS |
| `zustand` (via stores) | State management |
| `@dnd-kit/*` | Drag-and-drop for notes/notebooks |
| `@lingui/core`, `@lingui/react` | Internationalization |
| `@mdi/js`, `@mdi/react` | Material Design icons |
| `react-hot-toast` | Toast notifications |
| `@hazae41/foras` | Compression (WASM gzip) |
| `@notesnook-importer/core` | Import from other note apps |
| `vite` | Build tool / dev server |

## Desktop app (`apps/desktop`)

| Dependency | Role |
|---|---|
| `electron` | Native desktop shell |
| `electron-trpc` | Type-safe IPC via tRPC |
| `electron-updater` | Auto-update |
| `@trpc/server` | tRPC server (IPC router) |

## Mobile app (`apps/mobile`)

| Dependency | Role |
|---|---|
| `react-native` | Cross-platform mobile framework |
| `@react-navigation/*` | Navigation |
| `detox` | E2E testing |

## Monograph (`apps/monograph`)

| Dependency | Role |
|---|---|
| Next.js | SSR framework |
| `express` (server.ts) | Custom server wrapper |

## Toolchain (root devDependencies)

| Tool | Role |
|---|---|
| `typescript` | Primary language |
| `eslint` + plugins | Linting |
| `prettier` | Formatting |
| `husky` | Git hooks |
| `@commitlint/cli` | Commit message linting (DCO sign-off required) |
| `tsdown` | Library bundler (packages) |
| `vite` | App bundler (web, vericrypt, theme-builder) |
| `react-native` | Mobile app runtime |

## Notable forks / vendored packages

- `@streetwriters/kysely` — Notesnook's fork of Kysely with custom SQLite dialect support for both browser (wa-sqlite/IndexedDB) and native (better-sqlite3) environments.
