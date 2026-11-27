<h1 align="center">Notesnook Desktop (native)</h1>
<h3 align="center">A native desktop app for macOS, Windows and Linux, built with React Native on <a href="https://github.com/streetwriters/react-native-gpui">react-native-gpui</a>.</h3>
<p align="center"><a href="#build-instructions">Build instructions</a> | <a href="#developer-guide">Developer guide</a> | <a href="#running-tests">Tests</a></p>

The app matches the [web app](../web/) and the current [desktop app](../desktop/) screen for screen, but draws its UI natively on the GPU instead of in a browser engine.

## Build instructions

> **Before you start, it is recommended that you read [the contributing guidelines](/CONTRIBUTING.md).**

### Setting up the development environment

Requirements:

1. [Node.js](https://nodejs.org/en/download/) 22.13 or newer
2. [git](https://git-scm.com/downloads)
3. `npm`
4. [Rust](https://rustup.rs) (the version is pinned in `rust-toolchain.toml` and installed by rustup on the first build)
5. CMake, and the platform's native toolchain: Xcode on macOS, the Visual Studio C++ build tools on Windows, and a C++ compiler with the system libraries on Linux

Follow [Setting up the development environment](https://streetwriters.github.io/react-native-gpui/docs/set-up-your-environment) for your OS. Once the dependencies below are installed, `npx react-native doctor-desktop` in `apps/desktop-native` checks the setup.

Clone the monorepo:

```bash
git clone https://github.com/streetwriters/notesnook.git

# change directory
cd notesnook
```

Install dependencies and bootstrap the desktop-native workspace:

```bash
# this might take a while to complete
npm install
npm run bootstrap -- --scope=desktop-native
```

### Running the app

```bash
# builds the app, starts Metro and opens the window
npm run start:desktop-native
```

The first run installs the native editor's JS build dependencies (`npm ci` in Cargo's checkout of `streetwriters/native-editor`, whose build script bundles the editor engine with esbuild), and the first build compiles the Rust side, which takes several minutes; later builds are incremental. The native runtime itself is downloaded prebuilt.

#### The Hermes engine

The Hermes engine is downloaded once per user, not per checkout: `scripts/with-hermes.mjs` (which `npm run start:desktop-native`, `desktop`, `build` and `build:test` go through) keeps it in a shared cache and points the build at it, so every worktree reuses the same copy and a build whose copy is already there never touches the network.

| Platform | Shared cache                                                     |
| -------- | ---------------------------------------------------------------- |
| macOS    | `~/Library/Caches/react-native-gpui/hermes`                      |
| Linux    | `$XDG_CACHE_HOME/react-native-gpui/hermes` (else `~/.cache/...`) |
| Windows  | `%LOCALAPPDATA%\react-native-gpui\hermes`                        |

```bash
# download it ahead of time, e.g. before building in a sandbox without network
npm run prefetch:hermes
# or install a hermes-<platform>.zip you downloaded from the release yourself
npm run prefetch:hermes -- --from ~/Downloads/hermes-darwin-arm64.zip
```

Set `RN_GPUI_HERMES_BIN_ROOT` to use another folder; when it is set it is used as it is. The cache holds `<platform>/` folders with a `.release` file naming the installed release: a copy for another release is replaced on the next build, and an install is staged next to the cache under a lock and moved into place whole, so builds in several worktrees at once are safe. When the copy is missing and cannot be downloaded, the build stops and prints the command to run once with network access and the `fetch-binaries.mjs --from` command for a manual download.

On macOS every rebuilt app is signed ad hoc, so the keychain asks again for each item the app stored. Set `APPLE_SIGNING_IDENTITY` to a signing identity, such as your Apple Development certificate, and choose "Always Allow" once:

```bash
APPLE_SIGNING_IDENTITY="Apple Development: Your Name (TEAMID)" npm run start:desktop-native
```

### Running the app in the browser (web target)

```bash
# dev server on http://localhost:5190
npm run web

# static bundle in build/web
npm run build:web
```

The web target (`src/targets/web`) implements the same `@notesnook/ui-kit` and `@platform` contracts with `react-dom` and browser APIs. It is for development and parity work and is never shipped. The shared `@notesnook/*` packages must be built first (`npm run build` in each, as for the native app). The app starts on the notes screen with a local database (wa-sqlite on IndexedDB); you can sign in or create local notes.

Vite resolves `@notesnook/ui-kit` and `@platform` only to `src/targets/web`. Importing anything that resolves into `src/targets/desktop` fails the build, and `@react-native-gpui/*` and `react-native` imports become a stub that throws "... is not implemented on web" when used.

What works: layout, navigation, theming, dialogs and popovers, lists, the local database (shared with `apps/web`'s wa-sqlite dialect), crypto (`globalThis.crypto`, sodium wasm), config and key-value storage (localStorage), clipboard, file pick and download, window title and fullscreen.

What is stubbed or limited:

| Area | Behaviour on web |
| --- | --- |
| Editor | Mounts the real `apps/web` Tiptap editor (see `docs/web-target-audit.md` for its gaps); desktop is still a stub |
| Safe storage | Reports encryption unavailable; the database key and user key are kept in localStorage (insecure, development only) |
| Attachments (`attachmentFiles`) | Throws "not implemented on web" |
| App lock, WebAuthn, spell checker settings, updater, integration setters | Throw "not implemented on web" or report unavailable |
| PDF viewer, avatar editor | Placeholders |
| Multi-tab | Not supported (single tab driver) |

### Useful development commands

Run these from `apps/desktop-native`:

```bash
# start Metro only
npm start

# type check (in a fresh checkout, use `npm run tx desktop-native:tsc`
# from the repo root: it builds the shared @notesnook/* packages first)
npm run tsc

# remove the native build output
npm run clean:build
```

## Developer guide

### The tech stack

1. React Native `0.87` with [react-native-gpui](https://github.com/streetwriters/react-native-gpui) (rendering with [GPUI](https://www.gpui.rs/))
2. React `19`
3. TypeScript
4. Zustand (state management)
5. Native modules from [react-native-gpui-modules](https://github.com/streetwriters/react-native-gpui-modules) (file system, keychain, PDF, spell checking, notifications, updates and more)
6. SQLite through `react-native-quick-sqlite`, and libsodium through `@ammarahmed/react-native-sodium`

### Project structure

Top-level directories in `apps/desktop-native/`:

- `src/app/`: the app itself, shared by every target (`views`, `dialogs`, `components`, `stores`, `navigation`, etc.). Dialogs copied from `apps/web` get what web takes from the browser or Electron (`window.open`, `window.location`, `desktop`, `IS_DESKTOP_APP`, `getPlatform`) by importing it from `dialogs/desktop-bridge.ts`, which implements it on `@platform`; `dialogs/web-globals.test.ts` fails on a browser global used without an import or a raw HTML element in a dialog
- `src/platform/`: the contracts for platform services (files, database, crypto, clipboard and so on)
- `../../packages/ui/src/kit/`: the `@notesnook/ui-kit` contracts (`contracts`), their desktop and web implementations (`desktop`, `web`) and the code both share (`shared`). Source only: app code imports the active target's kit as `@notesnook/ui-kit` (each target's tsconfig, Metro and Vite config map it), and target code reaches files in the kit as `@notesnook/ui-kit/<dir>/...`; the web build fails if `web` or `shared` imports a react-native package. The contracts follow the theme-ui, DOM, react-virtuoso and react-modal API that `apps/web` uses; [docs/ui-kit-web-api.md](docs/ui-kit-web-api.md) lists what is kept, what is a subset and what is deprecated
- `src/targets/desktop/`: the desktop implementation of `@platform`, and `ui/`, which re-exports the kit's desktop implementation plus the app's `EditorSurface`
- `src/targets/web/`: the same for the web target
- `desktop/`: the native project: `desktop.json` (window, identifier, packaging), the Rust entry point, assets and the end-to-end tests in `desktop/e2e/`
- `tools/`: asset and icon generators, the visual parity tools, performance scripts and `ui-kit-web-api/` (`npm run check:web-api`: scans `apps/web` for the UI APIs it uses, fails if the kit contract lacks one, and regenerates the table in `docs/ui-kit-web-api.md`) and `divergence/` (`npm run report:divergence`: pairs every file in `src/app` with its `apps/web/src` counterpart, removes imports, and lists the changed lines per file; `-- --show <path>` prints one pair's diff, `-- --json` the whole report. `divergence/allowlist.json` lists the files allowed to differ, each with its category (platform, native-editor, desktop-only) and reason. `npm run check:divergence` is the gate CI runs: it exits 1 when a file differs beyond imports, or has no web counterpart, and is not allowlisted) and `codemod/` (`npm run codemod -- [--write] <file|dir>...`: renames `onPress`, `onHoverIn/Out`, `testID`, `onChangeText` (on `Input`, `Textarea`), `numberOfLines` (on `Text`) and `resizeMode` (on `Image`) to the web API names, and lists what it left for a manual change; tests in `lib.test.mjs`) and `web-kit-proof/` (`node tools/web-kit-proof/index.mjs switch` repoints apps/web's `@theme-ui/components`, `react-virtuoso` and `react-modal` imports at `@notesnook/ui-kit`; `report <base> [<head>]` prints the diff size and every change that isn't an import edit; the last run's results are in `docs/web-on-kit-proof.md`)

The app code only imports `@notesnook/ui-kit` and `@platform/*`; Metro resolves them to the active target. Stylesheets that copied web components import (`*.css`) resolve to an empty module, since the desktop draws its own styling (`metro.config.js`).

## Running tests

The end-to-end tests drive the real app through the react-native-gpui test driver. Build the test binary first, then run the specs:

```bash
npm run build:test:desktop-native
npm run test:desktop-native
```

To run only some specs, from `apps/desktop-native`:

```bash
npm run test:e2e -- platform pdf-preview
```

Each launch opens a real window, so leave the machine alone while the tests run.

CI (`.github/workflows/desktop-native.tests.yml`) builds the test app on Linux and Windows and runs the `boot`, `shell-launch` and `editor-*` specs there (under Xvfb on Linux); type checking and unit tests run on Linux.

Unit tests, from `apps/desktop-native`:

```bash
npm run test:unit
```

In a fresh checkout, run `npm run test:unit:desktop-native` (or
`npm run tx desktop-native:test:unit`) from the repo root instead: it builds
the shared `@notesnook/*` packages first.

## Packaging

Build the optimized app, or the installers for the current OS (the second from `apps/desktop-native`):

```bash
npm run build:desktop-native
npx react-native package-desktop
```

See [Publishing your app](https://streetwriters.github.io/react-native-gpui/docs/publishing-desktop) for signing and installer formats.
