const IS_CI = !!process.env.CI;

const projects = IS_CI
  ? [
      {
        name: "Firefox",
        use: { browserName: "firefox" },
      },
      {
        name: "WebKit",
        use: { browserName: "webkit" },
      },
    ]
  : [
      {
        name: "Chromium",
        use: {
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
    ];

module.exports = {
  webServer: {
    command: "npm run debug",
    port: 3000,
    timeout: 60 * 1000,
    reuseExistingServer: false, //!IS_CI,
  },
  // Look for test files in thcleare "tests" directory, relative to this configuration file
  testDir: "__e2e__",

  // Each test is given 30 seconds
  timeout: 30000,
  workers: IS_CI ? 3 : 4,
  reporter: "list",
  retries: IS_CI ? 3 : 0,
  use: {
    headless: true,
    acceptDownloads: true,

    // Artifacts
    trace: IS_CI ? "off" : "retain-on-failure",
    screenshot: IS_CI ? "off" : "only-on-failure",
    video: IS_CI ? "off" : "retry-with-video",

    viewport: {
      width: 1280,
      height: 720,
    },
    screen: {
      width: 1280,
      height: 720,
    },
  },
  projects,
};
