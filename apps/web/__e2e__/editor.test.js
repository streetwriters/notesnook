const { Page, test, expect } = require("@playwright/test");
const {
  createNote,
  NOTE,
  getTestId,
  getEditorTitle,
  getEditorContent,
  getEditorContentAsHTML,
} = require("./utils");
const {
  checkNotePresence,
  createNoteAndCheckPresence,
} = require("./utils/conditions");
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

test("creating a new note should clear the editor contents & title", async () => {
  await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  expect(await getEditorTitle()).toBe("");

  expect(await getEditorContent()).toBe("");
});

test("creating a new note should clear the word count", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await createNote({ title: "Hello World" }, "notes");

  await expect(page.innerText(getTestId("editor-word-count"))).resolves.toBe(
    "0 words"
  );
});

test("creating a new title-only note should add it to the list", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await createNoteAndCheckPresence({ title: "Hello World" });
});

test("format changes should get saved", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await page.waitForSelector(".mce-content-body");

  await page.keyboard.press("Shift+End");

  await page.click(`#editorToolbar button[title="Bold"]`);

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  const content = await getEditorContentAsHTML();

  expect(content).toMatchSnapshot(`format-changes-should-get-saved.txt`);
});

test("opening an empty titled note should empty out editor contents", async () => {
  await createNoteAndCheckPresence();

  const onlyTitle = await createNoteAndCheckPresence({
    title: "Only a title",
  });

  await page.click(getTestId("notes-action-button"));

  await page.reload();

  const fullNote = await checkNotePresence("home", 1, NOTE);

  await page.click(fullNote);

  await expect(getEditorContent()).resolves.toBe(NOTE.content);

  await expect(getEditorTitle()).resolves.toBe(NOTE.title);

  await page.click(onlyTitle);

  await expect(getEditorTitle()).resolves.toBe("Only a title");

  await expect(getEditorContent()).resolves.toBe("");
});

test("focus should not jump to editor while typing in title input", async () => {
  await page.click(getTestId("notes-action-button"));

  await page.waitForSelector(".mce-content-body");

  await page.type(getTestId("editor-title"), "Hello", { delay: 200 });

  await expect(getEditorTitle()).resolves.toBe("Hello");

  await expect(getEditorContent()).resolves.toBe("");
});

test("select all & backspace should clear all content in editor", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.focus(".mce-content-body");

  await page.keyboard.press("Shift+End");

  await page.waitForTimeout(500);

  await page.keyboard.press("Backspace");

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  await page.waitForSelector(".mce-content-body");

  await expect(getEditorContent()).resolves.toBe("");
});

test.only("last line doesn't get saved if it's font is different", async () => {
  const selector = await createNoteAndCheckPresence();

  await page.keyboard.press("Enter");

  await page.click(`#editorToolbar button[title="Fonts"]`);

  await page.click(`div[title="Serif"]`);

  await page.type(".mce-content-body", "I am another line in Serif font.");

  await page.waitForTimeout(200);

  await page.click(getTestId("notes-action-button"));

  await page.click(selector);

  const content = await getEditorContentAsHTML();

  expect(content).toMatchSnapshot(`last-line-with-different-font.txt`);
});
