/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "..",
  maxWorkers: 1,
  testTimeout: 120000,
  globalSetup: "./e2e/globalSetup.ts",
  globalTeardown: "detox/runners/jest/globalTeardown",
  setupFilesAfterEnv: ["./e2e/setup.ts"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  reporters: ["detox/runners/jest/reporter"],
  testRunner: "jest-circus/runner",
  testMatch: ["<rootDir>/e2e/**/*.e2e.(js|ts)"],
  transform: {
    "\\.tsx?$": "ts-jest",
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      { configFile: "../native/babel.config.js" }
    ]
  },
  verbose: true
};
