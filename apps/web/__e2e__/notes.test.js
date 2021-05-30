/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-undef */

/**
 * TODO: We are still not checking if toast appears on delete/restore or not.
 */

const { getTestId, createNote, NOTE } = require("./utils");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
expect.extend({ toMatchImageSnapshot });
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
} = require("./utils/conditions");
const List = require("./utils/listitemidbuilder");
const Menu = require("./utils/menuitemidbuilder");

// const testCISkip = process.env.CI ? test.skip : test;

var createNoteAndCheckPresence = async function createNoteAndCheckPresence(
  note = NOTE
) {
  await createNote(note, "notes");

  // make sure the note has saved.
  await page.waitForTimeout(1000);

  let noteSelector = await checkNotePresence();

  await page.click(noteSelector, { button: "left" });

  return noteSelector;
};

const staticCreateNoteAndCheckPresence = createNoteAndCheckPresence.bind(this);

async function deleteNoteAndCheckAbsence() {
  const noteSelector = await createNoteAndCheckPresence();

  await openContextMenu(noteSelector);

  await clickMenuItem("movetotrash");

  // await confirmDialog();

  await expect(isToastPresent()).resolves.toBeTruthy();

  await navigateTo("trash");

  const trashItemSelector = List.new("trash").atIndex(0).title().build();

  await expect(isPresent(trashItemSelector)).resolves.toBeTruthy();

  await expect(page.innerText(trashItemSelector)).resolves.toBe(NOTE.title);

  return trashItemSelector;
}

async function lockUnlockNote(noteSelector, type) {
  await openContextMenu(noteSelector);

  await clickMenuItem(type);

  await page.fill(getTestId("dialog-password"), "123abc123abc");

  await confirmDialog();

  await expect(isToastPresent()).resolves.toBeTruthy();
}

async function checkNotePinned(noteSelector, pause) {
  await openContextMenu(noteSelector);

  const unpinSelector = Menu.new("menuitem").item("unpin").build();

  await expect(isPresent(unpinSelector)).resolves.toBeTruthy();

  await closeContextMenu(noteSelector);

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  const note = await page.$(List.new("note").grouped().atIndex(0).build());
  await expect(note.screenshot()).resolves.toMatchImageSnapshot({
    failureThreshold: 5,
    allowSizeMismatch: true,
    failureThresholdType: "percent",
  });
}

async function checkNoteLocked(noteSelector) {
  await expect(
    isPresent(List.new("note").grouped().atIndex(0).locked().build())
  ).resolves.toBeTruthy();

  await expect(
    page.textContent(List.new("note").grouped().atIndex(0).body().build())
  ).resolves.toBe("");

  await useContextMenu(noteSelector, () =>
    expect(
      isPresent(Menu.new("menuitem").item("unlock").build())
    ).resolves.toBeTruthy()
  );
}

async function checkNoteColored(noteSelector) {
  await openContextMenu(noteSelector);

  await expect(
    isPresent(Menu.new("menuitem").colorCheck("red").build())
  ).resolves.toBeTruthy();

  await closeContextMenu(noteSelector);

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  const note = await page.$(List.new("note").grouped().atIndex(0).build());
  await expect(note.screenshot()).resolves.toMatchImageSnapshot({
    failureThreshold: 5,
    allowSizeMismatch: true,
    failureThresholdType: "percent",
  });

  await navigateTo("red");

  // wait for the page to render and notes to populate
  await page.waitForTimeout(500);

  const coloredNote = await page.$(List.new("note").atIndex(0).build());
  if (!coloredNote) throw new Error("Colored note not present.");
  await expect(coloredNote.screenshot()).resolves.toMatchImageSnapshot({
    allowSizeMismatch: true,
    failureThreshold: 5,
    failureThresholdType: "percent",
  });
}

async function addNoteToNotebook() {
  await page.type(getTestId("mnd-new-notebook-title"), "Test Notebook");

  await page.press(getTestId("mnd-new-notebook-title"), "Enter");

  await page.click(List.new("notebook").atIndex(0).build());

  await page.click(List.new("notebook").atIndex(0).topic(0).build());

  await expect(isToastPresent()).resolves.toBeTruthy();

  await navigateTo("notebooks");

  await page.click(List.new("notebook").atIndex(0).title().build());

  await page.click(List.new("topic").atIndex(0).title().build());

  await checkNotePresence(0, false);
}

describe.each(["independent", "sequential"])("run tests %sly", (type) => {
  beforeAll(async () => {
    if (type === "sequential") {
      await page.goto("http://localhost:3000/");
    }
  });
  // clear all browser data after running all tests for a single case
  // so this will clear all data after running test independently & sequentially.
  afterAll(async () => {
    try {
      await jestPlaywright.resetContext();
      await page.goto("http://localhost:3000/");
    } catch (e) {}
  });

  beforeEach(async () => {
    // we only close and open new page when running tests independently
    // otherwise we simply navigate to home.
    if (type === "independent") {
      await page.close();
      page = await browser.newPage();
      await page.goto("http://localhost:3000/");
    } else {
      // only navigate to Home if we are not at home
      if ((await page.textContent(getTestId("routeHeader"))) !== "Notes")
        await navigateTo("notes");
    }
  }, 600000);

  // we have to reset the createNoteAndCheckPresence after every test
  afterEach(() => {
    if (type === "independent") {
      createNoteAndCheckPresence = staticCreateNoteAndCheckPresence;
    } else {
      createNoteAndCheckPresence = async function () {
        let noteSelector = List.new("note").atIndex(0).grouped().build();
        await page.click(noteSelector, { button: "left" });
        return noteSelector;
      };
    }
  });

  test("create a note", createNoteAndCheckPresence);

  test("delete a note", deleteNoteAndCheckAbsence);

  test("restore a note", async () => {
    const trashItemSelector =
      type === "independent"
        ? await deleteNoteAndCheckAbsence()
        : List.new("trash").atIndex(0).title().build();

    if (type === "sequential") await navigateTo("trash");

    await openContextMenu(trashItemSelector);

    await clickMenuItem("restore");

    await expect(isToastPresent()).resolves.toBeTruthy();

    await navigateTo("notes");

    await checkNotePresence();
  });

  test.skip("add a note to notebook", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await openContextMenu(noteSelector);

    await clickMenuItem("addtonotebook(s)");

    await addNoteToNotebook();
  });

  test("favorite a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await useContextMenu(noteSelector, async () => {
      await clickMenuItem("favorite");
    });

    await useContextMenu(noteSelector, async () => {
      await expect(
        isPresent(Menu.new("menuitem").item("unfavorite").build())
      ).resolves.toBeTruthy();
    });

    await navigateTo("favorites");

    await checkNotePresence(0, false);

    await navigateTo("notes");
  });

  test("unfavorite a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    if (type === "independent") {
      await useContextMenu(noteSelector, async () => {
        await clickMenuItem("favorite");
      });
    }

    await page.waitForTimeout(500);

    await useContextMenu(noteSelector, async () => {
      await clickMenuItem("unfavorite");
    });

    await useContextMenu(noteSelector, async () => {
      await expect(
        isPresent(Menu.new("menuitem").item("favorite").build())
      ).resolves.toBeTruthy();
    });
  });

  test("favorite a note from properties", async () => {
    let noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-favorite"));

    await page.click(getTestId("properties-close"));

    await navigateTo("favorites");

    noteSelector = await checkNotePresence(0, false);

    await useContextMenu(noteSelector, async () => {
      await expect(
        isPresent(Menu.new("menuitem").item("unfavorite").build())
      ).resolves.toBeTruthy();
    });

    await navigateTo("notes");
  });

  test("assign a color to a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await openContextMenu(noteSelector);

    await page.click(Menu.new("menuitem").color("red").build());

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

    if (type === "independent")
      await useContextMenu(noteSelector, () => clickMenuItem("pin"));

    await page.waitForTimeout(500);

    await useContextMenu(noteSelector, () => clickMenuItem("unpin"));

    await useContextMenu(noteSelector, () =>
      expect(
        isPresent(Menu.new("menuitem").item("pin").build())
      ).resolves.toBeTruthy()
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
});

describe("run tests only independently", () => {
  beforeAll(() => {
    createNoteAndCheckPresence = staticCreateNoteAndCheckPresence;
  });

  beforeEach(async () => {
    await page.goto("http://localhost:3000/");
  }, 600000);

  afterEach(async () => {
    await page.close();
    page = await browser.newPage();
  });

  test("lock a note", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector, "lock");

    await checkNoteLocked(noteSelector);
  });

  test("unlock a note permanently", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await lockUnlockNote(noteSelector, "lock");

    await page.waitForTimeout(500);

    await lockUnlockNote(noteSelector, "unlock");

    await expect(
      isAbsent(List.new("note").grouped().atIndex(0).locked().build())
    ).resolves.toBeTruthy();

    await expect(
      page.textContent(List.new("note").grouped().atIndex(0).body().build())
    ).resolves.toContain(NOTE.content);

    await openContextMenu(noteSelector);

    await expect(
      isPresent(Menu.new("menuitem").item("lock").build())
    ).resolves.toBeTruthy();

    await closeContextMenu(noteSelector);
  });

  test("lock a note from properties", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-locked"));

    await page.fill(getTestId("dialog-password"), "123abc123abc");

    await confirmDialog();

    // TODO fix this: no toast is shown when locking note from properties.
    //await expect(isToastPresent()).resolves.toBeTruthy();

    await checkNoteLocked(noteSelector);
  });

  test.skip("add a note to notebook from properties", async () => {
    await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-add-to-nb"));

    await addNoteToNotebook();
  });

  test("assign a color to note from properties", async () => {
    const noteSelector = await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.click(getTestId("properties-red"));

    await checkNoteColored(noteSelector);
  });

  test("tag with words from properties", async () => {
    await createNoteAndCheckPresence();

    await page.click(getTestId("properties"));

    await page.fill(getTestId("properties-tag"), "testtag");

    await page.press(getTestId("properties-tag"), "Enter");

    await expect(
      isPresent(getTestId("properties-tag-testtag"))
    ).resolves.toBeTruthy();
  });
});
