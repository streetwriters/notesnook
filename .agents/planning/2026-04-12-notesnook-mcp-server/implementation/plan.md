# Implementation Plan — Notesnook MCP Server

## Checklist

- [x] Step 1: Package scaffold and database setup
- [x] Step 2: IStorage adapter and database initialization
- [x] Step 3: Authentication and startup wiring
- [x] Step 4: Sync wiring
- [x] Step 5: Permission store
- [x] Step 6: Note read tools (`list_notes`, `search_notes`, `get_note`)
- [x] Step 7: Note write tools (`create_note`, `update_note`, `delete_note`)
- [x] Step 8: Notebook tools
- [x] Step 9: Tag tools
- [x] Step 10: Reminder tools
- [x] Step 11: Permission tools (`grant_access`, `revoke_access`, `list_permissions`)
- [x] Step 12: Sync tool — implementation complete; end-to-end test pending
- [x] Step 13: Unit/integration tests for `NodeStorageInterface` and `PermissionStore`

## Implementation notes

### arm64 native module fix
`better-sqlite3-multiple-ciphers@11.5.0` fails to compile on arm64 macOS because `-maes`/`-msse4.2` leak into `xcode_settings.OTHER_CFLAGS` even with the `cflags!` strip condition. Fixed by patching `deps/sqlite3.gyp` to add `OTHER_CFLAGS!: ['-maes', '-msse4.2']` inside the arm64/arm conditions. Patch committed to `packages/mcp/patches/better-sqlite3-multiple-ciphers+11.5.0.patch`.

### @streetwriters/kysely dual-package type conflict
`mcp` and `core` each install their own copy of `@streetwriters/kysely` (non-hoisted monorepo), causing a nominal type mismatch. Resolved with `as any` cast inside an eslint-disable/enable block in `db.ts`.

### mcp_kv table name
Core owns a `kv` table via its own migrations. MCP storage uses `mcp_kv` to avoid collisions.

### Vitest configuration
`@notesnook/sodium` ships WASM with node/browser conditional exports. Vite's default browser conditions cannot resolve it; `vitest.config.ts` sets `resolve.conditions: ["node", ...]` and marks `@notesnook/*` and native modules as `server.deps.external`. The sodium package must be built (`npm run build` in `packages/sodium`) before tests can run — this is a one-time dev setup step. The sodium package has been built as part of session setup.

---

## Step 1: Package scaffold and database setup

**Objective:** Create the `packages/mcp/` package with correct monorepo configuration, dependencies, and a working TypeScript build.

**Implementation guidance:**
- Create `packages/mcp/package.json` following the pattern of `packages/common/package.json` — use npm workspaces, declare `@notesnook/mcp` as the package name, set `"type": "module"`, add a `"bin"` entry pointing to `dist/index.js`
- Add a `tsconfig.json` extending the root tsconfig
- Add `@modelcontextprotocol/sdk`, `zod`, and `better-sqlite3-multiple-ciphers` as dependencies; `@notesnook/core`, `@streetwriters/kysely`, `sqlite-better-trigram`, `sqlite3-fts5-html`, `sqlite-regex` are already in the monorepo — reference them as workspace dependencies
- Create `src/index.ts` as a minimal entry point that prints "Notesnook MCP Server starting..." and exits cleanly
- Verify `npm run build` succeeds from `packages/mcp/`

**Test requirements:**
- Build succeeds with no TypeScript errors
- `node dist/index.js` runs and exits without crashing

**Integration with previous work:** N/A — this is the foundation everything else builds on.

**Demo:** `node dist/index.js` prints the startup message and exits cleanly. `tsc --noEmit` passes.

---

## Step 2: IStorage adapter and database initialization

**Objective:** Implement the `IStorage` interface for Node.js and wire up a working `@notesnook/core` `Database` instance backed by a real SQLite file.

**Implementation guidance:**
- Create `src/storage.ts` implementing `IStorage` using a SQLite key-value table (a single `kv` table with `key TEXT PRIMARY KEY, value TEXT`), backed by a second `BetterSQLite3` instance (separate from the core DB, or the same one with a dedicated table)
- The crypto methods on `IStorage` (`encrypt`, `decrypt`, `deriveCryptoKey`, etc.) should delegate to `@notesnook/crypto`'s `NNCrypto`
- Create `src/db.ts` with a `createDatabase(dataDir: string): Database` function following the reference implementation in `packages/core/__tests__/utils/index.ts` — load the three SQLite extensions (`sqlite-better-trigram`, `sqlite3-fts5-html`, `sqlite-regex`), pass `NodeStorageInterface`, and call `db.setup()`
- Data directory defaults to `~/.notesnook-mcp/`; override with `NOTESNOOK_DATA_DIR` env var
- `src/index.ts` should call `createDatabase()` and `db.init()`, then exit

**Test requirements:**
- Unit test: `NodeStorageInterface` read/write/delete/clear/getAllKeys round-trips correctly
- Integration test: `createDatabase()` + `db.init()` completes without error against a temp directory; SQLite file is created on disk

**Integration with previous work:** Builds on Step 1's package scaffold.

**Demo:** Running `node dist/index.js` creates `~/.notesnook-mcp/db.sqlite` on disk and exits without error.

---

## Step 3: Authentication and startup wiring

**Objective:** Authenticate against the Notesnook API using env var credentials and surface clear errors when authentication fails.

**Implementation guidance:**
- Read `NOTESNOOK_EMAIL` and `NOTESNOOK_PASSWORD` from `process.env`; exit with code 1 and a helpful message if either is missing
- Call `db.user.login(email, password)` after `db.init()`; on failure, print the error and exit with code 1
- Add a `src/config.ts` that reads and validates all env vars in one place
- Log successful login to stderr (stdout is reserved for MCP protocol messages on stdio transport)
- All logging throughout the server must go to **stderr**, never stdout

**Test requirements:**
- Integration test: missing env vars produce a non-zero exit and a descriptive message
- Integration test: invalid credentials produce a non-zero exit with the API error message

**Integration with previous work:** Calls `createDatabase()` and `db.init()` from Step 2, then layers login on top.

**Demo:** With valid credentials in env vars, `node dist/index.js` logs "Authenticated as user@example.com" to stderr and continues running. With missing or wrong credentials, it exits immediately with a clear error.

---

## Step 4: Sync wiring

**Objective:** Wire up bidirectional sync so that writes are automatically pushed and remote changes are received without a periodic timer.

**Implementation guidance:**
- In `src/index.ts`, after login, subscribe to `EVENTS.databaseSyncRequested`:
  ```ts
  db.eventManager.subscribe(EVENTS.databaseSyncRequested, async (full, force) => {
    await db.sync.start({ type: full ? "full" : "send", force });
  });
  ```
- Subscribe to `EVENTS.syncCheckStatus` and return `{ type, result: true }` for both `autoSync` and `sync` check IDs (so auto-sync is always enabled)
- Call `db.sync.start({ type: "full" })` for the initial full sync
- Call `db.connectSSE()` for the real-time push channel
- Create `src/sync.ts` to encapsulate these subscriptions and expose a `startSync(db)` function
- Log sync events (started, completed, errors) to stderr

**Test requirements:**
- Unit test: `EVENTS.databaseSyncRequested` subscription calls `db.sync.start()` with the correct options
- Unit test: `syncCheckStatus` handler returns `true` for both check IDs

**Integration with previous work:** Layers on top of Step 3's authenticated DB instance.

**Demo:** On startup, a full sync runs to completion (logged to stderr). Manually triggering `EVENTS.databaseSyncRequested` in a test causes `db.sync.start()` to be called.

---

## Step 5: Permission store

**Objective:** Implement the permission store — the core of the access control system — with grant/revoke/list and a correct `checkAccess` implementation.

**Implementation guidance:**
- Create `src/permissions.ts` with the `PermissionStore` class
- Persist grants to `{dataDir}/permissions.json`; load on construction, save after every mutation
- Implement `grant()`, `revoke()`, `list()`, and `checkAccess(note, operation)` per the design
- `checkAccess` must:
  1. Return `false` if no grants cover the note (deny by default)
  2. Check each grant: notebook match (via `db.relations`), tag match (via note's tag relations), or direct note ID match
  3. Intersect permissions across all matching grants (least permissive wins)
  4. Short-circuit to `false` for write/delete if `note.readonly === true`
- Create a `src/permissions-helper.ts` with `noteIsInNotebook(db, note, notebookId)` and `noteHasTag(db, note, tagId)` helpers that query `db.relations`
- Export a `withPermissionCheck(db, store, noteId, operation, fn)` helper that tools can use to gate access uniformly

**Test requirements:**
- Unit tests covering all `checkAccess` branches:
  - No grants → deny
  - Notebook grant matches → allow read if grant includes read
  - Tag grant matches → allow
  - Direct note grant matches → allow
  - Multiple grants, intersection: `["read"]` ∩ `["read","write"]` = `["read"]` → write denied
  - `note.readonly === true` → write/delete denied regardless of grants
- Unit test: `grant()` persists to JSON; `revoke()` removes by ID; `list()` returns all

**Integration with previous work:** Standalone module; will be consumed by all tool handlers in Steps 6–11.

**Demo:** A test script grants access to a notebook, checks access for a note in that notebook, verifies write is denied when `note.readonly` is set, and verifies the JSON file is written to disk.

---

## Step 6: Note read tools — `list_notes`, `search_notes`, `get_note`

**Objective:** Stand up the MCP server with the first three tools wired end-to-end — a user can connect and read notes they have access to.

**Implementation guidance:**
- Create `src/server.ts` that builds and returns a configured `McpServer` instance; `index.ts` calls it after auth + sync
- Connect `StdioServerTransport` in `index.ts`
- Create `src/tools/notes.ts` and register the three read tools:
  - `list_notes`: query `db.notes.all` with filters (notebook, tag, favorite, pinned, archived); filter results through `checkAccess(note, "read")`; return JSON array of note metadata (id, title, dateModified, notebooks, tags)
  - `search_notes`: call `db.lookup.notes(query).items(limit ?? 20)`; filter through `checkAccess`; return metadata list
  - `get_note`: call `db.notes.note(id)`; check read access; export as markdown via `db.notes.export(id, { format: "md" })`; return content
- All three return only notes the user has granted read access to — inaccessible notes are silently excluded from lists and return a permission error for direct `get_note` calls
- Return errors as MCP tool errors (use `isError: true` in the response content)

**Test requirements:**
- Integration test: `list_notes` with a notebook grant returns only notes in that notebook
- Integration test: `search_notes` filters out notes without access
- Integration test: `get_note` on an inaccessible note returns a permission error
- Integration test: `get_note` returns markdown content for an accessible note

**Integration with previous work:** Wires `PermissionStore` (Step 5) into real MCP tool handlers; uses the authenticated DB (Steps 2–4).

**Demo:** Claude Desktop (or `npx @modelcontextprotocol/inspector`) connects to the server, calls `list_notes`, and sees notes from a granted notebook. Calling `get_note` on a non-granted note returns a clear permission error.

---

## Step 7: Note write tools — `create_note`, `update_note`, `delete_note`

**Objective:** Add the three write tools, completing full CRUD for notes.

**Implementation guidance:**
- Add to `src/tools/notes.ts`:
  - `create_note`: call `db.notes.add({ title, content })` (content is markdown — import via `db.content`); optionally call `db.relations.add` to link to a notebook; apply tags; no permission check needed on create (the note doesn't exist yet), but the target notebook must be granted write access if specified
  - `update_note`: check write access via `withPermissionCheck`; call `db.notes.add({ id, ...fields })` (core uses upsert semantics); for content updates, update via `db.content`
  - `delete_note`: check delete access; call `db.notes.moveToTrash(id)` — this moves to trash (soft delete), consistent with how the apps behave
- Respect `note.readonly` — `withPermissionCheck` already short-circuits this

**Test requirements:**
- Integration test: `create_note` creates a note, readable via `get_note`
- Integration test: `update_note` changes title and content; re-reading returns updated markdown
- Integration test: `delete_note` moves note to trash; subsequent `get_note` returns not-found
- Integration test: `update_note` on a `readonly` note returns the correct error
- Integration test: `update_note` without write permission returns permission error

**Integration with previous work:** Extends Step 6's notes tool file; reuses `withPermissionCheck`.

**Demo:** Ask Claude to create a note titled "Test from MCP", update its content, then delete it — all confirmed via `get_note` calls between steps.

---

## Step 8: Notebook tools

**Objective:** Add full notebook management — list, create, delete, and move notes between notebooks.

**Implementation guidance:**
- Create `src/tools/notebooks.ts` and register:
  - `list_notebooks`: `db.notebooks.all.items()` — return all notebooks (id, title, description, dateModified); no permission filtering (notebook list is always visible so the AI can ask for grants)
  - `create_notebook`: `db.notebooks.add({ title, description })`
  - `delete_notebook`: `db.notebooks.remove(id)` — only if no notes with write-only access remain (or follow core behaviour, which handles cascading)
  - `add_note_to_notebook`: check write access on the note; call `db.relations.add({ from: { id: notebookId, type: "notebook" }, to: { id: noteId, type: "note" } })`
  - `remove_note_from_notebook`: check write access; call `db.relations.remove(...)`

**Test requirements:**
- Integration test: `create_notebook` → `list_notebooks` returns new notebook
- Integration test: `add_note_to_notebook` → `list_notes({ notebook })` returns the note
- Integration test: `remove_note_from_notebook` → note no longer appears in notebook listing
- Integration test: `delete_notebook` removes it from `list_notebooks`

**Integration with previous work:** Parallel to note tools; both read from the same DB instance.

**Demo:** Ask Claude to create a notebook "MCP Test", create a note, add it to the notebook, list the notebook's notes, then remove and clean up.

---

## Step 9: Tag tools

**Objective:** Add tag management — list, create, and apply/remove tags on notes.

**Implementation guidance:**
- Create `src/tools/tags.ts` and register:
  - `list_tags`: `db.tags.all.items()` — return all tags (id, title); no permission filtering (same rationale as notebooks)
  - `create_tag`: `db.tags.add({ title })`
  - `tag_note`: check write access on the note; call `db.relations.add({ from: { id: tagId, type: "tag" }, to: { id: noteId, type: "note" } })`
  - `untag_note`: check write access; call `db.relations.remove(...)`

**Test requirements:**
- Integration test: `create_tag` → `list_tags` returns new tag
- Integration test: `tag_note` → `get_note` shows tag in metadata; note appears in `list_notes({ tag })`
- Integration test: `untag_note` removes tag association
- Integration test: `tag_note` without write permission returns permission error

**Integration with previous work:** Follows the same pattern as notebook tools.

**Demo:** Ask Claude to create a tag "mcp-test", apply it to a note, list notes by that tag, then untag.

---

## Step 10: Reminder tools

**Objective:** Add full reminder CRUD.

**Implementation guidance:**
- Create `src/tools/reminders.ts` and register:
  - `list_reminders`: `db.reminders.all.items()` — return all reminders (id, title, description, date, mode, priority, disabled)
  - `create_reminder`: `db.reminders.add({ title, date, mode, description, priority, selectedDays })`
  - `update_reminder`: `db.reminders.add({ id, ...fields })` (upsert semantics)
  - `delete_reminder`: `db.reminders.remove(id)`
- Reminders are not note-scoped so no permission check is required beyond being authenticated

**Test requirements:**
- Integration test: `create_reminder` → `list_reminders` returns it with correct fields
- Integration test: `update_reminder` changes the date; re-reading shows updated value
- Integration test: `delete_reminder` removes it from the list

**Integration with previous work:** Standalone; uses DB from Steps 2–4.

**Demo:** Ask Claude to set a reminder titled "Review MCP notes" for tomorrow, list reminders to confirm, then delete it.

---

## Step 11: Permission tools — `grant_access`, `revoke_access`, `list_permissions`

**Objective:** Add the permission management tools, completing the access control UX.

**Implementation guidance:**
- Create `src/tools/permissions.ts` and register:
  - `list_permissions`: return `store.list()` — all current grants with targetType, targetName, permissions, createdAt
  - `revoke_access`: call `store.revoke(grantId)`; return confirmation
  - `grant_access`:
    1. Resolve `targetName` to an ID:
       - `"notebook"`: search `db.notebooks.all.items()` for title match
       - `"tag"`: search `db.tags.all.items()` for title match
       - `"note"`: call `db.lookup.notes(targetName).items(10)`; if 0 matches → error; if >1 match → return `NoteAmbiguityResult` with metadata (title, notebooks, tags, dateModified) for each match; if exactly 1 → proceed
    2. On successful resolution, call `store.grant(targetType, resolvedId, targetName, permissions)`
    3. Return the created grant

**Test requirements:**
- Integration test: `grant_access` for a notebook resolves name → ID and creates a grant
- Integration test: `grant_access` for an ambiguous note title returns all matches with metadata, not a grant
- Integration test: `grant_access` for a unique note title resolves and grants
- Integration test: `revoke_access` removes the grant; subsequent `checkAccess` denies
- Integration test: `list_permissions` returns all active grants

**Integration with previous work:** Integrates `PermissionStore` (Step 5) with live DB lookups; the first tool category that closes the full user-facing loop.

**Demo:** Start a fresh session with no grants. Ask Claude to list notebooks (visible without grants), then grant read access to one. Confirm `list_notes` now returns notes from that notebook. Revoke the grant and confirm access is denied again.

---

## Step 12: Sync tool, final wiring, and package publication

**Objective:** Add the manual `sync` tool, complete the `README`, and wire everything together so the package is ready for use with Claude Desktop.

**Implementation guidance:**
- Add `src/tools/sync.ts` with the `sync` tool: calls `db.sync.start({ type: options.type ?? "full" })` and returns a confirmation with the sync type used
- Add graceful shutdown: on `SIGINT`/`SIGTERM`, call `db.sync.start({ type: "send" })` to flush any pending writes, then `db.sync.stop()` and exit cleanly
- Write `packages/mcp/README.md` with:
  - Installation instructions (`npm install` from monorepo root)
  - Claude Desktop config snippet (with `NOTESNOOK_EMAIL` / `NOTESNOOK_PASSWORD` env vars)
  - List of available tools
  - Permissions quick-start guide
- Add `packages/mcp` to the root `package.json` workspaces array if not already present
- Verify the full startup → login → sync → tool call → sync-on-write → graceful-shutdown sequence works end-to-end

**Test requirements:**
- Integration test: `sync` tool with `type: "send"` calls `db.sync.start({ type: "send" })`
- Integration test: `sync` tool with no args defaults to `"full"`
- End-to-end smoke test: start server, connect with MCP inspector, call `list_notes`, call `create_note`, verify note appears on `list_notes`, verify sync fires after write
- Integration test: SIGTERM causes graceful shutdown (final send-sync, then exit 0)

**Integration with previous work:** Completes the full tool surface; ties together all previous steps.

**Demo:** Full walkthrough with Claude Desktop — authenticate, grant access to a notebook, list notes, create a note, verify it syncs to the Notesnook web app, read it back, delete it.
