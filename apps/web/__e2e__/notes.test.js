/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-undef */

/**
 * TODO: We are still not checking if toast appears on delete/restore or not.
 */
const { Page, test, expect } = require("@playwright/test");

const {
  getTestId,
  NOTE,
  downloadFile,
  PASSWORD,
  editNote,
  getEditorTitle,
  getEditorContent,
  isTestAll,
} = require("./utils");
const {
  navigateTo,
  clickMenuItem,
  openContextMenu,
  confirmDialog,
  closeContextMenu,
  useContextMenu,
} = require("./utils/actions");
const {
  isToastPresent,
  isPresent,
  isAbsent,
  checkNotePresence,
  createNoteAndCheckPresence,
  checkMenuItemText,
} = require("./utils/conditions");
const List = require("./utils/listitemidbuilder");
const Menu = require("./utils/menuitemidbuilder");
const { LoremIpsum } = require("lorem-ipsum");

/**
 * @type {Page}
 */
var page = null;

async function deleteNoteAndCheckAbsence(viewId = "home") {
  const noteSelector = await createNoteAndCheckPresence(undefined, viewId);

  await openContextMenu(noteSelector);

  await clickMenuItem("movetotrash");

  // await confirmDialog();

  await expect(isToastPresent()).resolves.toBeTruthy();

  await navigateTo("trash");

  const trashItemSelector = List.new("trash")
    .grouped()
    .atIndex(0)
    .title()
    .build();

  await expect(isPresent(trashItemSelector)).resolves.toBeTruthy();

  await expect(page.innerText(trashItemSelector)).resolves.toBe(NOTE.title);

  return trashItemSelector;
}

async function lockUnlockNote(noteSelector) {
  await openContextMenu(noteSelector);

  await clickMenuItem("lock");

  await page.fill(getTestId("dialog-password"), PASSWORD);

  await confirmDialog();

  await expect(isToastPresent()).resolves.toBeTruthy();
}

async function openLockedNote(noteSelector, title = NOTE.title) {
  await page.click(noteSelector);

  await expect(page.textContent(getTestId("unlock-note-title"))).resolves.toBe(
    title
  );

  await page.fill(getTestId("unlock-note-password"), PASSWORD);

  await page.click(getTestId("unlock-note-submit"));
}

async function checkNotePinned(noteSelector, pause) {
  await openContextMenu(noteSelector);

  await checkMenuItemText("pin", "Unpin");

  await closeContextMenu(noteSelector);

  // wait for the menu to properly close
  await page.waitForTimeout(500);
}

async function checkNoteLocked(noteSelector) {
  await page.waitForTimeout(500);

  await expect(
    isPresent(List.new("note").grouped().atIndex(0).locked().build())
  ).resolves.toBeTruthy();

  await expect(
    isAbsent(List.new("note").grouped().atIndex(0).body().build())
  ).resolves.toBeTruthy();

  await openContextMenu(noteSelector);

  await checkMenuItemText("lock", "Unlock");

  await closeContextMenu(noteSelector);
}

async function checkNoteColored(noteSelector) {
  await page.waitForTimeout(1000);

  await openContextMenu(noteSelector);

  await page.click(Menu.new("menuitem").item("colors").build());

  await expect(
    isPresent(Menu.new("menuitem").item("red").checked().build())
  ).resolves.toBeTruthy();

  await closeContextMenu(noteSelector);

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  await navigateTo("red");

  // wait for the page to render and notes to populate
  await page.waitForTimeout(500);

  const coloredNote = await page.$(
    List.new("note").grouped().atIndex(0).build()
  );
  if (!coloredNote) throw new Error("Colored note not present.");
}

async function addNoteToNotebook() {
  await page.type(getTestId("mnd-new-notebook-title"), "Test Notebook");

  await page.press(getTestId("mnd-new-notebook-title"), "Enter");

  await page.click(List.new("notebook").atIndex(0).build());

  await page.type(getTestId("mnd-new-topic-title"), "Topic 1");

  await page.press(getTestId("mnd-new-topic-title"), "Enter");

  await page.click(List.new("notebook").atIndex(0).topic(0).build());

  await page.click(getTestId("dialog-yes"));

  await expect(isToastPresent()).resolves.toBeTruthy();

  await navigateTo("notebooks");

  await page.click(List.new("notebook").grouped().atIndex(0).title().build());

  await page.click(List.new("topic").grouped().atIndex(0).title().build());

  await checkNotePresence("notes");
}

async function exportNote(format) {
  const noteSelector = await createNoteAndCheckPresence();

  await openContextMenu(noteSelector);

  await page.click(Menu.new("menuitem").item("export").build());

  // we need to override date time so
  // date created & date edited remain fixed.
  await page.evaluate(() => {
    // eslint-disable-next-line no-extend-native
    Date.prototype.toLocaleString = () => "xxx";
  });

  const output = await downloadFile(getTestId(`menuitem-${format}`), "utf-8");
  expect(output).toMatchSnapshot(`export-${format}.txt`);
}

test.describe("run tests independently", () => {
  test.beforeEach(async ({ page: _page, baseURL }) => {
    page = _page;
    global.page = _page;
    await page.goto(baseURL);
    await page.waitForSelector(getTestId("routeHeader"));
  });

  test("create a note", async () => {
    await createNoteAndCheckPresence();
  });

  test("delete a note", async () => {
    await deleteNoteAndCheckAbsence();
  });

  test("restore a note", async () => {
    const trashItemSelector = await deleteNoteAndCheckAbsence();

    await openContextMenu(trashItemSelector);

    await clickMenuItem("restore");

    await expect(isToastPresent()).resolves.toBeTruthy();

    await navigateTo("notes");

    await checkNotePresence("home");
  });

  test("add a note to notebook", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await openContextMenu(noteSelector);

    await clickMenuItem("addtonotebook");

    await addNoteToNotebook();
  });

  test("favorite a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await useContextMenu(noteSelector, async () => {
      await clickMenuItem("favorite");
    });

    await useContextMenu(
      noteSelector,
      async () => {
        await checkMenuItemText("favorite", "Unfavorite");
      },
      true
    );

    await navigateTo("favorites");

    await checkNotePresence("notes");

    await navigateTo("notes");
  });

  test("unfavorite a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await useContextMenu(noteSelector, async () => {
      await clickMenuItem("favorite");
    });

    await page.waitForTimeout(500);

    await useContextMenu(noteSelector, async () => {
      await clickMenuItem("favorite");
    });

    await useContextMenu(
      noteSelector,
      async () => {
        await checkMenuItemText("favorite", "Favorite");
      },
      true
    );
  });

  test("favorite a note from properties", async () => {
    let noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-favorite"));

    await page.click(getTestId("properties-close"));

    await navigateTo("favorites");

    noteSelector = await checkNotePresence("notes");

    await useContextMenu(
      noteSelector,
      async () => {
        await checkMenuItemText("favorite", "Unfavorite");
      },
      true
    );

    await navigateTo("notes");
  });

  test("assign a color to a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await openContextMenu(noteSelector);

    await page.click(Menu.new("menuitem").item("colors").build());
    await page.click(Menu.new("menuitem").item("red").build());

    await page.click(getTestId("properties"));

    await expect(
      isPresent(getTestId("properties-red-check"))
    ).resolves.toBeTruthy();

    await page.click(getTestId("properties-close"));

    await checkNoteColored(noteSelector);
  });

  test("pin a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await useContextMenu(noteSelector, () => clickMenuItem("pin"));

    await checkNotePinned(noteSelector);
  });

  test("unpin a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await useContextMenu(noteSelector, () => clickMenuItem("pin"));

    await page.waitForTimeout(500);

    await useContextMenu(noteSelector, () => clickMenuItem("pin"));

    await useContextMenu(
      noteSelector,
      async () => await checkMenuItemText("pin", "Pin"),
      true
    );
  });

  test("pin a note from properties", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-pinned"));

    await page.click(getTestId("properties-close"));

    await checkNotePinned(noteSelector, true);
  });

  test("permanently delete a note", async () => {
    //editor-title  //quill
    const trashItemSelector = await deleteNoteAndCheckAbsence();

    await openContextMenu(trashItemSelector);

    await clickMenuItem("delete");

    await confirmDialog();

    await expect(isToastPresent()).resolves.toBeTruthy();

    await expect(page.$(trashItemSelector)).resolves.toBeFalsy();
  });

  test("lock a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector);

    await checkNoteLocked(noteSelector);
  });

  test("unlock a note permanently", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector, "lock");

    await page.waitForTimeout(1000);

    await lockUnlockNote(noteSelector, "unlock");

    await expect(
      isAbsent(List.new("note").grouped().atIndex(0).locked().build())
    ).resolves.toBeTruthy();

    await expect(
      page.textContent(List.new("note").grouped().atIndex(0).body().build())
    ).resolves.toContain(NOTE.content);

    await openContextMenu(noteSelector);

    await checkMenuItemText("lock", "Lock");

    await closeContextMenu(noteSelector);
  });

  test("lock a note from properties", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-locked"));

    await page.fill(getTestId("dialog-password"), PASSWORD);

    await confirmDialog();

    // TODO fix this: no toast is shown when locking note from properties.
    //await expect(isToastPresent()).resolves.toBeTruthy();

    await checkNoteLocked(noteSelector);
  });

  test("assign a color to note from properties", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-red"));

    await checkNoteColored(noteSelector);
  });

  test("add tags to note", async () => {
    await createNoteAndCheckPresence();
    const tags = ["hello", "nevermind", "what", "no-way", "gold-and-goldie"];

    for (let tag of tags) {
      await page.fill(getTestId("editor-tag-input"), tag);

      await page.press(getTestId("editor-tag-input"), "Enter");

      await expect(isPresent(getTestId(`tag-${tag}`))).resolves.toBeTruthy();
    }
  });

  test(`export note as txt`, async () => await exportNote("txt"));
  test(`export note as md`, async () => await exportNote("md"));
  test(`export note as html`, async () => await exportNote("html"));

  test("unlock a note for editing", async () => {
    const content = "Edits 1 2 3 ";

    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector, "lock");

    await checkNoteLocked(noteSelector);

    await openLockedNote(noteSelector);

    await editNote(null, content);

    await page.waitForTimeout(1000);

    await openLockedNote(noteSelector);

    await page.waitForTimeout(1000);

    const editorContent = await getEditorContent();
    expect(editorContent).toContain(`${content}${NOTE.content}`);
  });

  test("change title of a locked note", async () => {
    const title = "NEW TITLE!";

    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector, "lock");

    await checkNoteLocked(noteSelector);

    await openLockedNote(noteSelector);

    await editNote(title);

    await page.waitForTimeout(1000);

    await openLockedNote(noteSelector, title);

    await page.waitForTimeout(1000);

    const editorTitle = await getEditorTitle();
    expect(editorTitle).toContain(title);
  });
});
