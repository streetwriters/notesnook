<h1 align="center">Notesnook Core</h1>
<h3 align="center">The shared core for building Notesnook on any platform.</h3>
<p align="center">
<a href="#developer-guide">Developer guide</a> | <a href="#build-instructions">How to build?</a> | <a href="#running-the-tests">Run the tests</a>
</p>

## Build instructions

**Before you start it is recommended that you read [the contributing guidelines](/CONTRIBUTING.md).**

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

And that's it. You can run the tests to make sure everything is working as it should:

```bash
npm run test:core
```

## Developer guide

### The tech stack

We try to keep the stack as lean as possible

1. Javascript
2. Jest: Testing framework

### Running the tests

When you are done making the required changes, you need to run the tests. We use Jest as the testing framework & the tests can be run with a single command:

```bash
npm run test:core
```
