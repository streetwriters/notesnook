/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.e2e.js"],
  testTimeout: 120000,
  maxWorkers: 1,
  setupFilesAfterEnv: ["./e2e/setup.js"],
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      { configFile: "../native/babel.config.js" }
    ]
  },
  transformIgnorePatterns: ["<rootDir>/../node_modules/"]
};
