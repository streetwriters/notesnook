# Research: Technologies

## Model Context Protocol (MCP)

**Spec version:** 2025-11-25  
**Official SDK:** `@modelcontextprotocol/sdk` (npm)  
**Source:** https://github.com/modelcontextprotocol/typescript-sdk

### Three Primitives

| Primitive | Who drives it | Use case |
|---|---|---|
| **Tools** | AI model chooses when to call | Execute actions: search notes, create note, add tag |
| **Resources** | Host app decides what to surface | Expose note content, notebook tree as context |
| **Prompts** | User triggers (slash commands) | Reusable templates: "summarize my notes on X" |

### Transport Options

| Transport | Use case |
|---|---|
| **stdio** | Local process — Claude Desktop, CLI tools; simplest auth |
| **Streamable HTTP** | Remote/network server; supports OAuth |

For this project: **stdio transport** is ideal since the MCP server runs locally alongside Claude Desktop/Code.

### TypeScript SDK Usage (Server)

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "notesnook",
  version: "1.0.0"
});

server.tool("search_notes", { query: z.string() }, async ({ query }) => {
  const results = await db.lookup.notes(query).items(20);
  return { content: [{ type: "text", text: JSON.stringify(results) }] };
});

server.resource("notebooks", "notesnook://notebooks", async () => ({
  contents: [{ uri: "notesnook://notebooks", text: JSON.stringify(notebooks) }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Schema Validation

SDK v1.x accepts Zod v4, Valibot, ArkType, or any Standard Schema compatible library.

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "notesnook": {
      "command": "node",
      "args": ["/path/to/notesnook-mcp/dist/index.js"],
      "env": {
        "NOTESNOOK_EMAIL": "user@example.com",
        "NOTESNOOK_PASSWORD": "..."
      }
    }
  }
}
```

## SQLite Stack for Node.js

| Package | Role |
|---|---|
| `better-sqlite3-multiple-ciphers` | SQLite3 Node.js binding with SQLCipher support |
| `@streetwriters/kysely` | Notesnook's Kysely fork — SQL query builder |
| `sqlite-better-trigram` | Trigram FTS extension (required) |
| `sqlite3-fts5-html` | HTML-aware FTS5 extension (required) |
| `sqlite-regex` | Regex support extension (required) |

All of these are already in the monorepo and used by the test suite.

## Notesnook Sync Server

- Repo: `streetwriters/notesnook-sync-server`
- Stack: ASP.NET Core + MongoDB + MinIO
- Self-hostable (alpha, no official docs)
- For the MCP server, we authenticate against the **official Notesnook API** (`api.notesnook.com`) by default, or a self-hosted instance via environment variable override.

## Packaging Options

| Option | Pros | Cons |
|---|---|---|
| **New package in monorepo** (`packages/mcp/`) | Co-located with core, easy imports, included in PRs | Adds to monorepo complexity |
| **Separate repository** | Clean separation, independent versioning | Harder to keep in sync with core changes |

**Recommendation:** New package inside the monorepo at `packages/mcp/` — consistent with how other consumers of `@notesnook/core` are structured, and allows the PR to be self-contained.
