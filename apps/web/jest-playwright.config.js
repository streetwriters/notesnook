const IS_CI = !!process.env.CI;

module.exports = {
  launchOptions: {
    headless: IS_CI,
    timeout: 10000,
  },
  serverOptions: {
    command: `yarn debug`,
    port: 3000,
  },
  browsers: IS_CI ? ["chromium", "firefox", "webkit"] : ["firefox"],
};
