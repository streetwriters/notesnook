<p align="center">
<img style="align:center;" src="/resources/screenshots/theme-builder.png" alt="Notesnook theme builder screenshot" width="600" />
</p>

<h1 align="center">Notesnook Theme Builder</h1>
<h3 align="center">The theme builder app is built using React, Typescript & Javascript.</h3>
<p align="center">
<a href="https://app.notesnook.com/">Try it out!</a> | <a href="#developer-guide">Developer guide</a> | <a href="#build-instructions">How to build?</a> | <a href="../desktop/">Desktop app</a>
</p>

## Getting started

## Build instructions

> **Before you start, it is recommended that you read [the contributing guidelines](/CONTRIBUTING.md).**

### Setting up the development environment

Requirements:

1. [Node.js](https://nodejs.org/en/download/)
2. [git](https://git-scm.com/downloads)
3. NPM (not yarn or pnpm)

Before you can do anything, you'll need to [install Node.js](https://nodejs.org/en/download/) on your system.

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

Now you can finally start the web app:

```bash
npm run start:theme-builder
```

If you'd like to build in production mode:

```bash
npm run build:theme-builder

# serve the app locally
npx serve apps/theme-builder/build
```
