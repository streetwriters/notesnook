---
title: Architecture
description: System architecture, layering strategy, and design patterns used in Notesnook
---

# Architecture

## High-level overview

Notesnook is a privacy-first, end-to-end-encrypted note-taking application distributed across web, desktop (Electron), and mobile (React Native) platforms. All platforms share a single core library; encryption is applied before data leaves the device.

```mermaid
graph TB
    subgraph Apps
        WEB[Web App<br/>apps/web]
        DESK[Desktop App<br/>apps/desktop]
        MOB[Mobile App<br/>apps/mobile]
        EXT[Browser Extension<br/>extensions/web-clipper]
    end

    subgraph Shared Packages
        CORE[Core<br/>packages/core]
        EDITOR[Editor<br/>packages/editor]
        CRYPTO[Crypto<br/>packages/crypto]
        SODIUM[Sodium<br/>packages/sodium]
        THEME[Theme<br/>packages/theme]
        COMMON[Common<br/>packages/common]
        INTL[Intl<br/>packages/intl]
        LOGGER[Logger<br/>packages/logger]
        STREAMFS[StreamableFS<br/>packages/streamable-fs]
    end

    subgraph Backends
        SYNC[Sync Server<br/>SignalR]
        S3[S3-compatible<br/>File Storage]
    end

    WEB --> CORE
    DESK --> CORE
    MOB --> CORE
    EXT --> CORE

    WEB --> EDITOR
    DESK --> EDITOR
    MOB --> EDITOR

    CORE --> CRYPTO
    CRYPTO --> SODIUM
    CORE --> STREAMFS
    CORE --> LOGGER

    WEB --> THEME
    DESK --> THEME
    WEB --> COMMON
    DESK --> COMMON
    MOB --> COMMON

    WEB --> INTL
    DESK --> INTL
    MOB --> INTL

    CORE <-->|E2E encrypted sync| SYNC
    CORE <-->|Encrypted file upload/download| S3
```

## Layered architecture

```mermaid
graph TB
    UI[UI Layer<br/>React / React Native components, stores]
    API[API Layer<br/>packages/core/src/api — unified app API]
    COLLECTIONS[Collections Layer<br/>Notes, Notebooks, Tags, Attachments …]
    DATABASE[Database Layer<br/>Kysely + SQLite / IndexedDB]
    CRYPTO_LAYER[Crypto Layer<br/>XChaCha20-Poly1305, Argon2 via libsodium]

    UI --> API
    API --> COLLECTIONS
    COLLECTIONS --> DATABASE
    DATABASE --> CRYPTO_LAYER
```

## Design principles

- **Zero-knowledge / E2E encryption**: all data is encrypted on device before sync. The server never sees plaintext.
- **Platform-agnostic core**: `@notesnook/core` exposes a single `Database` class; platform adapters inject storage, crypto, and FS implementations via constructor arguments (dependency injection through accessor pattern).
- **SQL-first storage**: the core uses [Kysely](https://github.com/koskimas/kysely) (fork: `@streetwriters/kysely`) as a type-safe query builder over SQLite (Node/Electron) or IndexedDB-backed SQL (web/mobile).
- **Collection pattern**: each entity type (notes, notebooks, tags…) has a dedicated collection class under `packages/core/src/collections/`.
- **Event-driven communication**: `EventManager` (core utility) broadcasts domain events; UI stores subscribe to update state.
- **Optimistic sync**: items are modified locally first; the `Sync` subsystem reconciles with the server using a collector → merger pipeline over SignalR.

## Encryption scheme

- Symmetric: `XChaCha20-Poly1305` (via libsodium)
- Key derivation: `Argon2`
- Asymmetric: key pairs used for vault sharing / secure hand-off
- All encryption delegated to `IStorage.encrypt/decrypt` — platform implementations provide the actual libsodium binding (browser WASM vs Node native)
