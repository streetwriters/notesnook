# Research: Existing Notesnook Codebase

Source: `github.com/streetwriters/notesnook` (master branch, April 2026)

## Repository Structure

TypeScript monorepo with three top-level groups:

```
notesnook/
├── packages/           # Shared libraries
│   ├── core/           # THE main entry point — @notesnook/core
│   ├── crypto/         # @notesnook/crypto — libsodium wrapper
│   ├── editor/         # Tiptap-based editor
│   ├── common/         # Shared singletons (exports `database` instance)
│   ├── streamable-fs/  # File streaming utilities
│   └── ...
├── apps/
│   ├── desktop/        # Electron app (Node.js + better-sqlite3)
│   ├── web/            # React SPA (wa-sqlite in browser OPFS)
│   └── mobile/         # React Native
└── servers/
    └── themes/         # Only themes; sync server is a separate repo
```

## @notesnook/core — The Central API

`packages/core/src/api/index.ts` exports a `Database` class that is the **only** programmatic interface needed. All apps instantiate and use it.

### Collections exposed on `db`:

| Property | Type | Description |
|---|---|---|
| `db.notes` | `Notes` | CRUD for notes |
| `db.notebooks` | `Notebooks` | CRUD for notebooks |
| `db.tags` | `Tags` | CRUD for tags |
| `db.colors` | `Colors` | Color labels |
| `db.attachments` | `Attachments` | File attachments |
| `db.reminders` | `Reminders` | Reminders |
| `db.trash` | `Trash` | Deleted items |
| `db.lookup` | `Lookup` | Full-text search |
| `db.vault` | `Vault` | Encrypted vaults |
| `db.backup` | `Backup` | Export/import backups |
| `db.user` | `UserManager` | Auth (login/logout/fetch) |
| `db.syncer` | `Sync` | Sync with Notesnook servers |
| `db.noteHistory` | `NoteHistory` | Version history per note |
| `db.relations` | `Relations` | Note↔notebook relationships |
| `db.settings` | `Settings` | App settings |

### Key Data Models (from `packages/core/src/types.ts`)

**Note:**
```ts
interface Note extends BaseItem<"note"> {
  title: string;
  headline?: string;
  contentId?: string;
  pinned: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;
  archived?: boolean;
  dateEdited: number;
  expiryDate: { value: number | null };
}
```

**Notebook:**
```ts
interface Notebook extends BaseItem<"notebook"> {
  title: string;
  description?: string;
  dateEdited: number;
  pinned: boolean;
}
```

**Tag / Color:**
```ts
interface Tag extends BaseItem<"tag"> { title: string; }
interface Color extends BaseItem<"color"> { colorCode: string; title: string; }
```

**BaseItem** (all items share): `id`, `type`, `dateModified`, `dateCreated`, `deleted?`, `synced?`

## Database Initialization in Node.js

From `packages/core/__tests__/utils/index.ts` — the authoritative reference for Node.js usage:

```ts
import DB from "@notesnook/core";
import { SqliteDialect } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import * as betterTrigram from "sqlite-better-trigram";
import * as fts5Html from "sqlite3-fts5-html";
import { getLoadablePath } from "sqlite-regex";

const betterSqliteDb = BetterSQLite3(dbPath).unsafeMode(true);

db.setup({
  storage: new NodeStorageInterface(),   // IStorage — key/value + crypto
  eventsource: EventSource,              // for SSE sync
  fs: FS,                                // IFileStorage — attachments
  compressor: async () => Compressor,    // ICompressor
  maxNoteVersions: async () => 1000,
  sqliteOptions: {
    dialect: (name) => new SqliteDialect({ database: betterSqliteDb }),
    password: "optional-encryption-password"
  },
  batchSize: 500
});

// Load SQLite extensions (required for FTS and search)
betterTrigram.load(betterSqliteDb);
fts5Html.load(betterSqliteDb);
betterSqliteDb.loadExtension(getLoadablePath()); // sqlite-regex

await db.init();
```

### IStorage Interface

Must implement: `read`, `write`, `readMulti`, `writeMulti`, `remove`, `removeMulti`, `clear`, `getAllKeys`, `encrypt`, `decrypt`, `encryptMulti`, `decryptMulti`, `deriveCryptoKey`, `getCryptoKey`, `generateCryptoKey`, `hash`.

A simple persistent implementation can use a JSON file or SQLite KV table.

## Authentication & Encryption

- **Notes content**: E2E encrypted using `@notesnook/crypto` (libsodium). The MCP server only sees decrypted content if it holds the user's encryption key (obtained via `db.user.login()`).
- **Database file**: Optionally encrypted with `better-sqlite3-multiple-ciphers`.
- **Auth flow**: `db.user.login(email, passwordHash)` → gets token → stored in kv → sync uses it.

## Search / Lookup API

`db.lookup.notes(query)` returns:
```ts
{
  items: (limit?, sortOptions?) => Promise<Note[]>,
  ids: (limit?, sortOptions?) => Promise<string[]>,
  sorted: (sortOptions?) => Promise<VirtualizedGrouping<Note>>
}
```

Supports FTS (full-text search), fuzzy matching, and filter operators:
- `tag:tagname`, `color:red`, `notebook:name`
- `is:favorite`, `is:pinned`, `is:archived`, `is:locked`
- `created:>2024-01-01`, `edited:<2024-12-31`

## Note Content Access

Content is stored separately in the `content` table (encrypted when using vault):
```ts
const content = await db.content.get(note.contentId);
// content.data is HTML (tiptap output)
// Use note export for plain text/markdown:
const text = await db.notes.export(noteId, { format: "txt" });
const md = await db.notes.export(noteId, { format: "md" });
```

Export formats: `"html"`, `"md"`, `"txt"`, `"md-frontmatter"`

## Sync Architecture

- `db.syncer.start({ type: "full" | "send" | "fetch" })` — triggers sync
- Requires authenticated user (token stored in kv)
- SSE endpoint for real-time push notifications
- Self-hosted sync server available at `streetwriters/notesnook-sync-server`

## Monorepo Package Manager

Uses npm workspaces. Root `package.json` defines workspaces. The `packages/common` package exports `database` singleton, used by web and other packages.

## Desktop App SQLite Details

- Uses `better-sqlite3-multiple-ciphers` (encrypted SQLite3)
- DB file location: Electron `app.getPath("userData")` → typically `~/Library/Application Support/Notesnook/` on macOS
- Loads custom extensions: `sqlite-better-trigram`, `sqlite3-fts5-html`, `sqlite-regex`
- Uses `@streetwriters/kysely` (Notesnook's Kysely fork) as SQL query builder
