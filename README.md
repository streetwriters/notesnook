<p align="center">
<img style="align:center;" src="https://notesnook.com/logo.svg" alt="Notesnook Logo" width="100" />
</p>

<h1 align="center">Notesnook</h1>
<h3 align="center">An end-to-end encrypted note taking alternative to Evernote.</h3>
<p align="center">
<a href="https://notesnook.com/">Website</a> | <a href="https://notesnook.com/roadmap">Roadmap</a> | <a href="https://notesnook.com/downloads">Downloads</a> | <a href="https://twitter.com/@notesnook">Twitter</a> | <a href="https://discord.gg/5davZnhw3V">Discord</a>
</p>

## Overview

Notesnook is a free (as in speech) & open source note taking app focused on user privacy & ease of use. To ensure zero knowledge principles, Notesnook encrypts everything on your device using `XChaCha20-Poly1305` & `Argon2`.

Notesnook is our **proof** that privacy does _not_ (always) have to come at the cost of convenience. Our goal is to provide users peace of mind & 100% confidence that their notes are safe and secure. The decision to go fully open source is one of the most crucial steps towards that.

This repository contains all the code required to build & use the Notesnook web, desktop & mobile clients. If you are looking for a full features list or screenshots, please check the [website](https://notesnook.com/).

## Developer guide

### Technologies & languages

Notesnook is built using the following technologies:

1. JavaScript/Typescript — this repo is in a hybrid state. A lot of the newer code is being written in Typescript & the old code is slowly being ported over.
2. React — the whole front-end across all platforms is built using React.
3. React Native — For mobile apps we are using React Native
4. NPM — listed here because we **don't** use Yarn or PNPM or XYZ across any of our projects.
5. Lerna & Nx — maintaining monorepos is hard but Nx makes it easier.

> **Note: Each project in the monorepo contains its own architecture details which you can refer to.**

### Monorepo structure

| Name                       | Path                                     | Description                                                       |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `@notesnook/web`           | [/apps/web][web]                         | Web/desktop clients                                               |
| `@notesnook/mobile`        | [/apps/mobile][mobile]                   | Android/iOS clients                                               |
| `@notesnook/core`          | [/packages/core][core]                   | Shared core between all platforms                                 |
| `@notesnook/crypto`        | [/packages/crypto][crypto]               | Cryptography library wrapper around libsodium                     |
| `@notesnook/editor`        | [/packages/editor][editor]               | Notesnook editor + all extensions                                 |
| `@notesnook/editor-mobile` | [/packages/editor-mobile][editor-mobile] | A very thin wrapper around `@notesnook/editor` for mobile clients |
| `@notesnook/logger`        | [/packages/logger][logger]               | Simple & pluggable logger                                         |
| `@notesnook/crypto-worker` | [/packages/crypto-worker][crypto-worker] | Helpers to use `@notesnook/crypto` from a Worker                  |
| `@notesnook/streamable-fs` | [/packages/streamable-fs][streamable-fs] | Streaming interface around an IndexedDB based file system         |
| `@notesnook/theme`         | [/packages/theme][theme]                 | The core theme used in web & desktop clients                      |

[web]: https://github.com/streetwriters/notesnook-private/tree/master/apps/web
[mobile]: https://github.com/streetwriters/notesnook-private/tree/master/apps/mobile
[core]: https://github.com/streetwriters/notesnook-private/tree/master/packages/core
[crypto]: https://github.com/streetwriters/notesnook-private/tree/master/packages/crypto
[editor]: https://github.com/streetwriters/notesnook-private/tree/master/packages/editor
[editor-mobile]: https://github.com/streetwriters/notesnook-private/tree/master/packages/editor-mobile
[logger]: https://github.com/streetwriters/notesnook-private/tree/master/packages/logger
[crypto-worker]: https://github.com/streetwriters/notesnook-private/tree/master/packages/crypto-worker
[streamable-fs]: https://github.com/streetwriters/notesnook-private/tree/master/packages/streamable-fs
[theme]: https://github.com/streetwriters/notesnook-private/tree/master/packages/theme

### Contributing guidelines

If you are interested in contributing to Notesnook, I highly recommend checking out [the contributing guidelines](/CONTRIBUTING.md) here. You'll find all the relevant information such as [style guideline](/CONTRIBUTING.md#style-guidelines), [how to make a PR](/CONTRIBUTING.md#opening--submitting-a-pull-request), [how to commit](/CONTRIBUTING.md#commit-guidelines) etc., there.

### Support & help

You can reach out to us via:

1. [Email](mailto:support@streetwriters.co)

2. [Discord](https://discord.gg/5davZnhw3V)

3. [Twitter](https://twitter.com/notesnook)

4. [Create an issue](https://github.com/streetwriters/notesnook/issues/new)

We take all queries, issues and bug reports that you might have. Feel free to ask.

## Additional Resources

- Migrating & importing your data from other apps — Importer

- Privacy policy & terms of service

- Verify Notesnook encryption claims yourself — Vericrypt

- Why Notesnook requires an email address?
