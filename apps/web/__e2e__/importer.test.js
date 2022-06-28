const { Page, test, expect } = require("@playwright/test");
const { getTestId, isTestAll, loginUser } = require("./utils");
const path = require("path");

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

if (!isTestAll()) test.skip();

test("login user & import notes", async () => {
  await loginUser();

  await page.click(getTestId("navitem-settings"));

  await page.click(getTestId("settings-importer"));

  await page.click(getTestId("settings-importer-import"));

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.click(getTestId("import-dialog-select-files")),
  ]);

  await fileChooser.setFiles(path.join(__dirname, "data", "importer-data.zip"));

  await page.click(getTestId("importer-dialog-notes"));

  let titles = [];
  for (let i = 0; i < 6; ++i) {
    const noteId = getTestId(`note-${i}-title`);
    const text = await page.innerText(noteId);
    titles.push(text);
  }

  expect(titles.join("\n")).toMatchSnapshot("importer-notes-titles.txt");
});
