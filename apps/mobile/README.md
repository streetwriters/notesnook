<p align="center">
<img style="align:center; border-radius: 20px;" src="/resources/screenshots/mobile.jpg" alt="Notesnook mobile screenshot" width="250" />
</p>

<h1 align="center">Notesnook Mobile</h1>
<h3 align="center">The mobile app is built using React Native, Typescript & Javascript for both iOS & Android.</h3>
<p align="center">
<a href="#developer-guide">Developer guide</a> | <a href="#build-instructions">How to build?</a>
</p>

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

1. [Node.js](https://nodejs.org/en/download/)
2. [git](https://git-scm.com/downloads)
3. NPM (not yarn or pnpm)
4. [React Native](https://reactnative.dev/docs/environment-setup)

To run the app locally, you will need to setup React Native on your system:

1. Open the official [environment setup guide here](https://reactnative.dev/docs/environment-setup)
2. Select `React Native CLI Quickstart`
3. Select your OS & the platform to run the app on (iOS or Android)
4. Follow the steps listed.

> Please keep in mind that **Expo is not supported**.

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

### Running the app on Android

[Setup an Android emulator from Android Studio](https://developer.android.com/studio/run/managing-avds) if you haven't already, and then run the following command to start the app in the Emulator:

```bash
npm run start:android
```

If you want to run the app on your phone, make sure to [enable USB debugging](https://developer.android.com/studio/debug/dev-options).

### Running the app on iOS

To run the app on iOS:

```bash
# this might take a while to complete
npm run prepare:ios

npm run start:ios
```

## Developer guide

> This project is in a transition state between Javascript & Typescript. We are gradually porting everything over to Typescript, so if you can help with that, it'd be great!

### The tech stack

We try to keep the stack as lean as possible:

1. React Native
2. Typescript/Javascript
3. Zustand: State management
4. Detox: Runs all our e2e tests
5. React Native MMKV: Database & persistence
6. libsodium: Encryption

### Project structure

The app codebase is distributed over two primary directories. `native/` and `app/`.

- `native/`: Includes `android/` and `ios/` folders and everything related to react native core functionality like bundling, development, and packaging. Any react-native dependency with native code, i.e., android & ios folders, is installed here.

- `app/`: Includes all the app code other than the native part. All JS-only dependencies are installed here.
  - `components/`: Each component serves a specific purpose in the app UI. For example, the `Paragraph` component is used to render paragraphs in the app, and a `Header` component is used to render a `header` on all screens.
  - `common/`: Features that are integral to the app's functionality. For example, the notesnook core is initialized here.
  - `hooks/`: Hooks for different app logic
  - `navigation/`: Includes app navigation-specific code. Here the app navigation, editor & side menu are rendered side by side in fluid tabs.
  - `screens`: Navigator screens.
  - `services`: Parts of code that do a specific function. For example, the `sync` service runs Sync from anywhere in the app.
  - `stores`: We use `zustand` for global state management in the app. Multiple stores provide the state for different parts of the app.
  - `utils`: General purpose stuff such as constant values, utility functions, etc.

There are several other folders at the root:

- `share/`: Code for the iOS Share Extension and Android widget.
- `e2e/`: Detox End to end tests
- `patches/`: Patches for various react native dependencies.

### Running the tests

When you are done making the required changes, you must run the tests to ensure you didn't break anything. We use Detox as the testing framework & the tests can be started as follows:

### Android

To run the tests on Android, you will need to create an emulator device on your system:

```
$ANDROID_HOME/tools/bin/avdmanager create avd -n Pixel_5_API_31 -d pixel --package "system-images;android-31;default;x86_64"
```

If you face problems, follow the detailed guide in [Detox documentation](https://wix.github.io/Detox/docs/introduction/android-dev-env). Keep the emulator name set to `Pixel_5_API_31`.

Once you have created an emulator device, build the Android apks:

```
npm run build:android
```

Finally, run the tests:

```
npm run test:android
```

### iOS

To run e2e tests on the iOS simulator, you must be on a Mac with XCode installed.

First, install [AppleSimulatorUtils](https://github.com/wix/AppleSimulatorUtils):

```
brew tap wix/brew
brew install applesimutils
```

Now build the iOS app for testing:

```
npm run build:ios
```

Finally, run the tests:

```
npm run test:ios
```

All tests on iOS are configured to run on `iPhone 8` simulator.
