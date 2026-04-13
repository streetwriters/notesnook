---
title: Workflows
description: Key processes — note lifecycle, sync, encryption, backup, and build/release
---

# Workflows

## Note creation & editing

```mermaid
sequenceDiagram
    participant UI as UI (web/mobile)
    participant Store as Editor Store
    participant Core as @notesnook/core
    participant DB as SQLite / IndexedDB
    participant Sync as Sync Engine

    UI->>Store: user types in editor
    Store->>Core: db.notes.add({ title, content })
    Core->>DB: insert/update note row
    Core->>DB: insert/update content row (Tiptap JSON)
    Core->>Store: emit EVENTS.noteUpdated
    Store->>UI: re-render note list
    Core->>Sync: mark item dirty for next sync
```

## Sync cycle

```mermaid
sequenceDiagram
    participant AutoSync
    participant Collector
    participant SignalR as SignalR Hub
    participant Merger
    participant DB

    AutoSync->>Collector: trigger on dirty items / timer
    Collector->>DB: SELECT items WHERE synced=false
    Collector->>Collector: encrypt items with user key
    Collector->>SignalR: push encrypted batches
    SignalR-->>Merger: stream remote changes
    Merger->>Merger: decrypt items
    Merger->>DB: upsert remote items (conflict resolution)
    Merger->>AutoSync: done
```

Conflict resolution strategy: last-write-wins by `dateModified`; conflicted notes are surfaced to the user for manual review.

## Authentication flow

```mermaid
sequenceDiagram
    participant UI
    participant UserManager
    participant TokenManager
    participant API as Notesnook API

    UI->>UserManager: login(email, password)
    UserManager->>API: POST /users/token
    API-->>TokenManager: access + refresh tokens
    TokenManager->>TokenManager: store tokens encrypted in KV
    UserManager->>UserManager: derive encryption key (Argon2)
    UserManager->>UI: authenticated
```

Token refresh is handled transparently by `TokenManager`; expired access tokens are refreshed using the stored refresh token.

## Attachment upload

```mermaid
sequenceDiagram
    participant Editor
    participant Core
    participant StreamableFS
    participant S3

    Editor->>Core: attachFile(file)
    Core->>StreamableFS: chunk + encrypt file (XChaCha20)
    StreamableFS->>Core: hash + encrypted chunks
    Core->>S3: upload chunks
    Core->>DB: store Attachment metadata (hash, key, size)
```

Download reverses the flow: chunks are fetched from S3, decrypted, and streamed to the consumer.

## Backup & restore

```mermaid
flowchart LR
    A[Export] --> B[Collect all items from DB]
    B --> C{Encrypt backup?}
    C -->|Yes| D[Encrypt data with user key]
    C -->|No| E[Plain JSON]
    D --> F[Write .nnbackupz file]
    E --> F

    G[Import] --> H[Read .nnbackupz]
    H --> I{Encrypted?}
    I -->|Yes| J[Decrypt with user key]
    I -->|No| K[Parse JSON]
    J --> L[Run migrations]
    K --> L
    L --> M[Upsert into DB]
```

## Monograph publishing

1. User picks a note and clicks "Publish".
2. Core generates a public slug and optionally encrypts with a reader password.
3. Metadata is pushed to the Notesnook sync server.
4. `apps/monograph` Next.js server fetches the encrypted content and renders it, decrypting client-side when a password is provided.

## Build & release pipeline

| Target | Trigger | Workflow file |
|---|---|---|
| Web | push to release branch | `web.publish.yml` |
| Desktop | push to release branch | `desktop.publish.yml` |
| iOS | push to release branch | `ios.publish.yml` |
| Android | push to release branch | `android.publish.yml` |
| Monograph | push | `monograph.publish.yml` |
| Preview (web) | PR | `web.preview.yml` |
| Preview (desktop) | PR | `desktop.preview.yml` |
| Preview (Android) | PR | `android.preview.firebase.yml` |
| Tests (core) | push / PR | `core.tests.yml` |
| Tests (web) | push / PR | `web.tests.yml` |

### Local development commands (via `npm run tx`)

| Command | What it does |
|---|---|
| `npm run bootstrap` | Install deps, link workspaces |
| `npm run start:web` | Dev server for web app |
| `npm run start:desktop` | Electron dev mode |
| `npm run start:android` | React Native Metro + Android |
| `npm run start:ios` | React Native Metro + iOS |
| `npm run test:core` | Core unit tests |
| `npm run test:web` | Web integration tests |
| `npm run build` | Build all (except mobile/web/monograph) |
| `npm run prettier` | Format all code |
| `npm run lint` | ESLint across apps + packages |

## Vault workflow

The vault is an additional layer of per-note encryption using a user-defined password separate from the account password.

1. User creates a vault with a password → `db.vault.create(password)`.
2. Core generates a vault key, encrypts it with the vault password, and stores the cipher in the `vaults` collection.
3. Locking a note encrypts its content with the vault key.
4. Unlocking requires the vault password; the vault key is held in memory for the session duration.
