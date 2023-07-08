module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: ['<rootDir>/../node_modules/'],
  setupFiles: [
    '../node_modules/react-native-gesture-handler/jestSetup.js',
    './jest.setup.js',
    '../node_modules/react-native-mmkv-storage/jest/mmkvJestSetup.js'
  ],
  roots: ['../__tests__']
};
