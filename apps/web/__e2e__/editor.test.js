const { Page, test, expect } = require("@playwright/test");
const { createNote, NOTE, getTestId } = require("./utils");
const { checkNotePresence } = require("./utils/conditions");
/**
 * @type {Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

test("focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("focus-mode.jpg", { threshold: 99 });
});

test("dark mode in focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("dark-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("dark-focus-mode.jpg", { threshold: 99 });

  await page.click(getTestId("dark-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("light-focus-mode.jpg", { threshold: 99 });
});

test("full screen in focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("enter-fullscreen"));

  await page.waitForTimeout(100);

  await page.click(getTestId("exit-fullscreen"));
});

test("normal mode from focus mode", async () => {
  await createNote(NOTE, "notes");

  await page.click(getTestId("focus-mode"));

  await page.waitForTimeout(500);

  await page.click(getTestId("normal-mode"));

  await page.waitForTimeout(1000);

  expect(
    await page.screenshot({ fullPage: true, quality: 100, type: "jpeg" })
  ).toMatchSnapshot("normal-mode-from-focus-mode.jpg", { threshold: 99 });
});
