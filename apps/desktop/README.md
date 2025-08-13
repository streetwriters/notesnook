<p align="center">
<img style="align:center;" src="/resources/screenshots/web.jpg" alt="Notesnook desktop screenshot" width="600" />
</p>

<h1 align="center">Notesnook Desktop</h1>
<h3 align="center">The desktop app is built using Electron & Typescript.</h3>
<p align="center">
<a href="https://notesnook.com/downloads">Downloads</a> | <a href="#developer-guide">Developer guide</a> | <a href="#build-instructions">How to build?</a>
</p>

## Getting started

## Build instructions

> **Before you start, it is recommended that you read [the contributing guidelines](/CONTRIBUTING.md).**

### Setting up the development environment

Requirements:

1. [Node.js](https://nodejs.org/en/download/)
2. [git](https://git-scm.com/downloads)
3. NPM (not yarn or pnpm)

Before you can do anything, you'll need to [install Node.js](https://nodejs.org/en/download/) v16 or later on your system.

1. `clone` the monorepo:

```bash
git clone https://github.com/streetwriters/notesnook.git

# change directory
cd notesnook
```

2. Install dependencies:

```bash
# this might take a while to complete
npm install
```

3. Run the webapp for desktop environment:

```bash
cd apps/web
npm run start:desktop
```

4. In a separate terminal session, run the desktop app from the root of the project:

```bash
npm run start:desktop
```

### Release mode

To run the app in release mode:

```bash
npm run staging -- --rebuild
```

This will compile and run the app in production mode but it won't generate any packages. To create the final packages, you'll have to run the following commands:

```bash
npm run release -- --rebuild

# For macOS
npx electron-builder --config=electron-builder.config.js --mac dmg --arm64 --x64 --publish never

# For Linux (AppImage)
npx electron-builder --config=electron-builder.config.js --linux AppImage:x64 AppImage:arm64 --publish never

# For Windows
npx electron-builder --config=electron-builder.config.js --win --publish never
```

Feel free to play around with the `electron-builder` command to get the packages you need. `npx electron-builder --help` is a great resource to learn different commands & platforms supported by `electron-builder`.

## Developer guide

### The tech stack

We try to keep the stack as lean as possible:

1. Electron
2. tRPC: for cross-communication between the web & desktop parts
3. zod: for runtime typechecking
4. yargs: for CLI argument parsing
