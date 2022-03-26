const { Page, test, expect } = require("@playwright/test");
const { clipboardData } = require("./clipboardData");
const { runClipboardTest } = require("./utils");

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(baseURL);
});

for (let data of clipboardData) {
  if (!data.headless) {
    continue;
  }
  runClipboardTest(data);
}
