/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: '../e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Notesnook.app',
      build: 'xcodebuild -workspace ios/Notesnook.xcworkspace -scheme YOUR_APP -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Notesnook.app',
      build: 'xcodebuild -workspace ios/Notesnook.xcworkspace -scheme YOUR_APP -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      "binaryPath": "android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk",
      "testBinaryPath": "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
      "build": "cd android ; ENVFILE=.env.test ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
      reversePorts: [
        8081
      ]
    },
    'android.release': {
      type: 'android.apk',
      "binaryPath": "android/app/build/outputs/apk/release/app-arm64-v8a-release.apk",
      "testBinaryPath": "android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk",
      "build": "cd android ; ENVFILE=.env.test ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release ; cd .."
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 12'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_34'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
