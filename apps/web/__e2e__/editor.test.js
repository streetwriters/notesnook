const { Page, test, expect } = require("@playwright/test");
const { createNote, NOTE, getTestId } = require("./utils");
/**
 * @type {Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page }) => {
  global.page = _page;
  page = _page;
  await page.goto("http://localhost:3000/");
});

test("focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("focus-mode.jpg", { threshold: 99 });
});
