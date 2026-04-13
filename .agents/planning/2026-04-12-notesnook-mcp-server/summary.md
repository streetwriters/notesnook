# Project Summary — Notesnook MCP Server

## Artifacts

```
.agents/planning/2026-04-12-notesnook-mcp-server/
├── rough-idea.md                    — Initial concept
├── idea-honing.md                   — Requirements Q&A (10 decisions)
├── research/
│   ├── existing-code.md             — @notesnook/core API, DB setup, sync architecture
│   └── technologies.md              — MCP SDK, SQLite stack, packaging options
├── design/
│   └── detailed-design.md           — Full design document
├── implementation/
│   └── plan.md                      — 12-step implementation plan with checklist
└── summary.md                       — This file
```

## Design Overview

A new `packages/mcp/` package in the Notesnook monorepo. Runs as a local stdio MCP server. Authenticates via `NOTESNOOK_EMAIL` / `NOTESNOOK_PASSWORD`, maintains its own SQLite DB via `@notesnook/core`, and syncs event-driven using the existing sync infrastructure.

**22 tools** across 6 groups: notes (6), notebooks (5), tags (4), reminders (4), permissions (3), sync (1).

Access is deny-by-default with additive grants by notebook, tag, or note title. Least permissive wins when multiple grants apply.

## Implementation Overview

12 incremental steps, each ending in demoable functionality:

| Step | What's demoable |
|---|---|
| 1 | Package builds and runs |
| 2 | SQLite DB created on disk |
| 3 | Authenticates with Notesnook API |
| 4 | Full sync on startup, auto-sync on writes |
| 5 | Permission grant/revoke/check works |
| 6 | Read notes via MCP (list, search, get) |
| 7 | Full note CRUD via MCP |
| 8 | Notebook management via MCP |
| 9 | Tag management via MCP |
| 10 | Reminder management via MCP |
| 11 | Permission tools close the access control loop |
| 12 | Manual sync tool + graceful shutdown + Claude Desktop ready |

## Next Steps

1. Add `packages/mcp/` to context: `/context add .agents/planning/2026-04-12-notesnook-mcp-server/**/*.md`
2. Begin implementation at Step 1 using `/agent-sops:code-assist`
3. After shipping v1, revisit: API token auth, MCP Resources/Prompts, vault support, colors
