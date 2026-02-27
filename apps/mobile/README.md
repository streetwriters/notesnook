<p align="center">
<img style="align:center; border-radius: 20px;" src="/resources/screenshots/mobile.jpg" alt="Notesnook mobile screenshot" width="250" />
</p>

<h1 align="center">Notesnook Mobile</h1>
<h3 align="center">The mobile app is built with React Native for both iOS and Android.</h3>
<p align="center"><a href="#build-instructions">Build instructions</a> | <a href="#developer-guide">Developer guide</a> | <a href="#running-e2e-tests-detox">E2E tests</a></p>

<p align="center">
    <a href="https://play.google.com/store/apps/details?id=com.streetwriters.notesnook">
    <img alt="Download on Google Play" src="https://play.google.com/intl/en_us/badges/images/badge_new.png" height=43>
    </a>
    <a href="https://apps.apple.com/us/app/notesnook-take-private-notes/id1544027013">
    <img alt="Download on App Store" src="https://user-images.githubusercontent.com/7317008/43209852-4ca39622-904b-11e8-8ce1-cdc3aee76ae9.png" height=43>
    </a>
</p>

## Build instructions

> **Before you start, it is recommended that you read [the contributing guidelines](/CONTRIBUTING.md).**

### Setting up the development environment

Requirements:

1. [Node.js](https://nodejs.org/en/download/) 20+ (the repo is pinned to Node `22.20.0` via Volta)
2. [git](https://git-scm.com/downloads)
3. `npm`
4. [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)

To run the app locally, first complete React Native native tooling setup:

1. Open [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment)
2. Select `React Native CLI Quickstart`
3. Select your OS and target platform(s): iOS and/or Android
4. Follow the steps listed.

> Expo is not used in this project.

Clone the monorepo:

```bash
git clone https://github.com/streetwriters/notesnook.git

# change directory
cd notesnook
```

Install dependencies and bootstrap the mobile workspace:

```bash
# this might take a while to complete
npm install
npm run bootstrap -- --scope=mobile
```

### Running the app on Android

[Set up an Android emulator from Android Studio](https://developer.android.com/studio/run/managing-avds) (or connect a physical device), then run:

```bash
npm run start:android
```

If you are using a physical device, enable [USB debugging](https://developer.android.com/studio/debug/dev-options).

### Running the app on iOS

Install CocoaPods dependencies first, then run the iOS app:

```bash
# this might take a while to complete
npm run prepare:ios

npm run start:ios
```

### Useful development commands

```bash
# start Metro only
npm run start:metro

# start Re.Pack bundler
npm run start:repack
```

## Developer guide

> The mobile app is a mixed TypeScript/JavaScript codebase.

### The tech stack

We try to keep the stack as lean as possible:

1. React Native `0.82`
2. React `19`
3. TypeScript + JavaScript
4. Zustand (state management)
5. Detox (end-to-end testing)
6. libsodium (encryption)

### Project structure

Top-level directories in `apps/mobile/`:

- `app/`: Main React Native app source (`components`, `common`, `hooks`, `navigation`, `screens`, `services`, `stores`, `utils`, etc.)
- `android/`: Android native project
- `ios/`: iOS native project
- `e2e/`: Detox test suite and config
- `patches/`: `patch-package` patches
- `scripts/`: Mobile-specific scripts

## Running E2E tests (Detox)

Detox device defaults in this repo:

- Android emulator: `Pixel_5_API_36`
- iOS simulator: `iPhone 17 Pro Max`

### Android

Build and run Android Detox tests:

```bash
npm run build:android
npm run test:android
```

For debug configuration:

```bash
npm run build:android:debug
npm run start:metro
npm run test:android:debug
```

### iOS

Build and run iOS Detox tests:

```bash
npm run build:ios
npm run test:ios
```

If simulator tooling is missing, install [AppleSimulatorUtils](https://github.com/wix/AppleSimulatorUtils):

```bash
brew tap wix/brew
brew install applesimutils
```

## Release commands

Android release helpers:

```bash
npm run release:android
npm run release:android:bundle
```
