const IS_CI = !!process.env.CI;

module.exports = {
  launchOptions: {
    headless: IS_CI,
  },
  serverOptions: {
    command: `yarn debug`,
    port: 3000,
    launchTimeout: 10000,
    debug: true,
  },
  browsers: IS_CI ? ["firefox", "chromium", "webkit"] : ["chromium"],
  devices: [],
};
