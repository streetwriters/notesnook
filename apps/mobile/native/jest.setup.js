import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';
import 'react-native-get-random-values';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import './globals.js';
let mmkvMock = require('react-native-mmkv-storage/jest/dist/jest/memoryStore.js');
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {}
}));
mmkvMock.mock();

global.console = {
  log: () => null
};

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('rn-fetch-blob', () => {
  return {
    DocumentDir: () => {},
    polyfill: () => {},
    fs: {
      dirs: {
        CacheDir: '',
        DocumentDir: ''
      }
    }
  };
});
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native-share', () => ({
  default: jest.fn()
}));
jest.mock('react-native-device-info', () => {
  return {
    supportedAbisSync: jest.fn(() => Promise.resolve('arm64-v8a')),
    getApplicationName: jest.fn(() => Promise.resolve('My App')),
    isTablet: jest.fn(() => Promise.resolve(false))
  };
});
