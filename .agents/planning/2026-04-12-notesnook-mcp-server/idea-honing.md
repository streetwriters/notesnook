# Idea Honing — Notesnook MCP Server

Requirements clarification Q&A.

---

## Q1: Read-only vs. read-write

Should the MCP server only allow AI agents to **read** notes, or also support **writing**?

**Answer:** Full CRUD, but with granular per-note permissions. The MCP tools allow the user to configure which notes/notebooks they grant access to and what kind of access (read, write, delete) — so the AI can only act within the explicitly granted scope.

---

## Q2: Database access approach

How should the MCP server connect to Notesnook data?

**Answer:** Credentials + own DB. Authenticate with email/password against `api.notesnook.com`, sync into a separate SQLite DB managed by the MCP server. Avoids DB encryption issues, write-conflict risk, and follows the designed/tested path in `@notesnook/core`.

---

## Q3: Authentication

**Answer:** Email/password via env vars (`NOTESNOOK_EMAIL`, `NOTESNOOK_PASSWORD`). API token support deferred as a future improvement to avoid unnecessary complexity in the initial implementation.

---

## Q4: Permissions — configuration mechanism

**Answer:** MCP permission tools as primary mechanism (Option B). The server exposes `grant_access` / `revoke_access` / `list_permissions` tools. The AI calls them, the user approves via the MCP client's confirmation UI, and permissions are persisted to a local JSON file. Static config file available as an optional power-user override.

---

## Note: App UX — No Changes Needed

The MCP server is conceptually just another sync client (like a second device). Existing apps handle multi-actor editing via sync, and the existing `note.readonly` flag covers write protection. No changes to web/desktop/mobile UI needed. API token generation is a future improvement.

---

## Q5: MCP tool surface

**Answer (revised after codebase study):**

| Group | Tools |
|---|---|
| **Notes** | `list_notes`, `search_notes`, `get_note`, `create_note`, `update_note`, `delete_note` |
| **Notebooks** | `list_notebooks`, `create_notebook`, `delete_notebook`, `add_note_to_notebook`, `remove_note_from_notebook` |
| **Tags** | `list_tags`, `create_tag`, `tag_note`, `untag_note` |
| **Reminders** | `list_reminders`, `create_reminder`, `update_reminder`, `delete_reminder` |
| **Permissions** | `grant_access`, `revoke_access`, `list_permissions` |
| **Sync** | `sync` |

Deferred: vault ops, attachments, monographs, note history, colors.

---

## Q6: Note content format

**Answer:** Markdown for both reads (`get_note`) and writes (`create_note`, `update_note`). `db.notes.export(id, { format: "md" })` already supports this natively.

---

## Q7: Sync behavior

**Answer:** Event-driven — no periodic timer needed. The MCP server must subscribe to `EVENTS.databaseSyncRequested` (as the web app does in `app-store.ts`) and call `db.sync.start()` in response. Flow:
1. AI writes note → core fires `EVENTS.databaseUpdated`
2. `AutoSync` debounces (100ms for content, 1s for metadata) → fires `EVENTS.databaseSyncRequested`
3. MCP server handler calls `db.sync.start({ type: "send" })`
4. For incoming remote changes: `db.connectSSE()` provides a real-time push channel

Full sync on startup, then fully event-driven. `sync` tool kept as a manual override.

---

## Q8: Permission granularity and precedence

**Answer:**
- **Deny by default** — no access unless explicitly granted; nothing stored = no access
- **Grant targets:** notebook (by name), tag (by name), or individual note (by title — MCP server resolves title → ID via `db.lookup.notes()`)
- **Access rule:** a note is accessible if **any** grant covers it (via its notebook, any of its tags, or a direct note grant)
- **Permission precedence:** when multiple grants cover the same note, **least permissive wins** (intersection). Rationale: privacy-first app — never accidentally expose more than intended.
- **Ambiguous note title:** if multiple notes match the given title, the MCP server returns all matches with metadata (title, notebook, tags, dateModified) for the user to disambiguate. Does not guess.
- **`note.readonly` flag** is always respected as a hard constraint regardless of grants.

---

## Q9: MCP primitives scope

**Answer:** Tools-only for v1. Resources and Prompts deferred — tools already cover all data access needs, and Resources only shine when the host proactively injects context (not the case here). Revisit after v1 ships.

---

## Q10: Packaging location

Should the MCP server live as a new package inside the monorepo (`packages/mcp/`) or as a separate repository?

**Answer:** `packages/mcp/` inside the monorepo. Co-located with `@notesnook/core`, no cross-repo versioning, self-contained PR.
