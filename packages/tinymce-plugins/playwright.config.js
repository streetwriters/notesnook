const IS_CI = !!process.env.CI;

const projects = [
  {
    name: "Chromium",
    use: {
      browserName: "chromium",
    },
  },
  //   {
  //     name: "Firefox",
  //     use: { browserName: "firefox" },
  //   },
  //   {
  //     name: "WebKit",
  //     use: { browserName: "webkit" },
  //   },
];

module.exports = {
  webServer: {
    command: `serve __tests__/host/`,
    port: 5000,
    timeout: 60 * 1000,
    reuseExistingServer: false, //!IS_CI,
  },
  // Look for test files in thcleare "tests" directory, relative to this configuration file
  // testDir: "__tests__",

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
