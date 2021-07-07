const { devices } = require("@playwright/test");
const IS_CI = !!process.env.CI;

module.exports = {
  // Look for test files in the "tests" directory, relative to this configuration file
  testDir: "__e2e__",

  // Each test is given 30 seconds
  timeout: 30000,
  workers: IS_CI ? 2 : 4,
  reporter: "list",
  use: {
    headless: true,

    // Artifacts
    screenshot: "only-on-failure",
    video: "retry-with-video",
  },
  projects: [
    {
      name: "Chromium",
      use: {
        // Configure the browser to use.
        browserName: "chromium",
      },
    },
    {
      name: "Firefox",
      use: { browserName: "firefox" },
    },
    {
      name: "WebKit",
      use: { browserName: "webkit" },
    },
  ],
};
