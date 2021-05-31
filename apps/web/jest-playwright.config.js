const IS_CI = true; // !!process.env.CI;

module.exports = {
  launchOptions: {
    headless: IS_CI,
    timeout: 10000,
  },
  serverOptions: {
    command: `yarn debug`,
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
  browsers: IS_CI ? ["chromium", "firefox", "webkit"] : ["firefox"],
  devices: [],
};
