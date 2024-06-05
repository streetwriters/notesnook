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

Once you have completed the setup, the first step is to `clone` the monorepo:

```bash
git clone https://github.com/streetwriters/notesnook.git

# change directory
cd notesnook
```

Once you are inside the `./notesnook` directory, run the preparation step:

```bash
# this might take a while to complete
npm install
```

Now you can finally start the desktop app for development:

```bash
npm run start:desktop
```

To run the app in release mode:

```bash
npm run staging -- --rebuild
```

This will compile and run the app in production mode but it won't generate any packages. To create the final packages, you'll have to run the following commands:

```bash
npm run release -- --rebuild

# For macOS
npx electron-builder --mac dmg --arm64 --x64 -publish never

# For Linux (AppImage)
npx electron-builder --linux AppImage:x64 AppImage:arm64 -publish never

# For Windows
npx electron-builder --win --publish never
```

Feel free to play around with the `electron-builder` command to get the packages you need. `npx electron-builder --help` is a great resource to learn different commands & platforms supported by `electron-builder`.

## Developer guide

### The tech stack

We try to keep the stack as lean as possible:

1. Electron
2. tRPC: for cross-communication between the web & desktop parts
3. zod: for runtime typechecking
4. yargs: for CLI argument parsing
