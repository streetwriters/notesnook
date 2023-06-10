<p align="center">
<img style="align:center;" src="/resources/screenshots/web.jpg" alt="Notesnook web screenshot" width="600" />
</p>

<h1 align="center">Notesnook Web</h1>
<h3 align="center">The web app is built using React, Typescript & Javascript.</h3>
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
npm run start:web
```

If you'd like to build in production mode:

```bash
npm run build:web

# serve the app locally
npx serve apps/web/build
```

## Developer guide

> This project is in a transition state between Javascript & Typescript. We are gradually porting everything over to Typescript, so if you can help with that, it'd be great!

### The tech stack

We try to keep the stack as lean as possible:

1. React v17: UI framework
2. Typescript/Javascript: The logical side of the app
3. Theme UI: For components, themeing etc.
4. Zustand: State management
5. Playwright: Runs all our e2e tests
6. localforage: Database & persistence
7. libsodium: Encryption

### Project structure

1. `src/`: 99% of the source code lives here & this is also where you'll spend most of your time.
   1. `index.tsx`: **the app entry point** responsible for loading the appropriate view based on the current route.
   2. `app.js`: **the default route** that contains the whole note-taking experience (notes list, navigation, editor, etc.)
   3. `views/`: Contains **all the views**, including views for login, settings, notes, notebooks & topics.
   4. `components/`: All the **reusable UI components** are here (e.g., button, editor, etc.)
   5. `stores/`: Contains the glue code & **logic for all the UI interactions**. For example, when you pin a note, the `src/stores/note-store.js` is responsible for everything, including refreshing the list to reflect the changes.
   6. `navigation/`: All the **routing & navigation** logic lives here. The app uses two kinds of routers:
      1. `routes.js`: This contains all the main routes like `/notes`, `/notebooks` with information on what to render when the user goes to a particular route.
      2. `hash-routes.js`: The hash routes are used for temporary navigation, like opening dialogs or opening a note. These look like `#/notes/6307bbd65d5d5d5cb86f6f74/edit`.
   7. `interfaces/`: This is where the **platform-specific storage & encryption logic** lives. These interface implementations are used by the `@notesnook/core` to provide capabilities such as persistence & encryption.
   8. `hooks/`: Contains all the **general-purpose React hooks**
   9. `utils/`: These are **general-purpose utilities** for performing various tasks such as downloading files, storing configuration, etc.
   10. `common/`: This directory contains **the shared logic between the whole app**. For example, this is where the database is instantiated for use throughout the app.
   11. `commands/`: These are **commands the desktop app uses** for things like checking for updates, storing backups etc.
2. `desktop/`: The Electron layer for **the desktop app lives here**. (This should be moved outside into its own project).

### Running the tests

When you are done making the required changes, you need to run the tests. We use Playwright as the testing framework. The tests can be started with a single command:

```bash
npm run test:web
```
