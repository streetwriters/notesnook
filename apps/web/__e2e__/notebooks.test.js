/* eslint-disable no-undef */
const { getTestId, createNote, NOTE, NOTEBOOK } = require("./utils");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
expect.extend({ toMatchImageSnapshot });
const {
  navigateTo,
  openContextMenu,
  useContextMenu,
  clickMenuItem,
  confirmDialog,
} = require("./utils/actions");
const List = require("./utils/listitemidbuilder");
const Menu = require("./utils/menuitemidbuilder");
const { checkNotePresence, isPresent } = require("./utils/conditions");

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto("http://localhost:3000/");
}, 600000);

afterEach(async () => page.close());

async function fillNotebookDialog(notebook) {
  await page.fill(getTestId("and-name"), notebook.title);

  await page.fill(getTestId("and-description"), notebook.description);

  for (let i = 0; i < notebook.topics.length; ++i) {
    let topic = notebook.topics[i];
    await page.fill(getTestId(`and-topic`), topic);
    await page.click(getTestId("and-topic-action"));
  }

  await page.click(getTestId("dialog-yes"));
}

async function createNotebook(notebook) {
  await page.click(getTestId("notebooks-action-button"));

  await fillNotebookDialog(notebook);
}

async function createNoteAndCheckPresence(note = NOTE) {
  await createNote(note, "notes");

  // make sure the note has saved.
  await page.waitForTimeout(1000);

  return await checkNotePresence(0, false, note);
}

async function checkNotebookPresence(notebook) {
  const notebookIdBuilder = List.new("notebook").atIndex(0);

  await expect(
    page.textContent(notebookIdBuilder.title().build())
  ).resolves.toBe(notebook.title);

  await expect(
    page.textContent(notebookIdBuilder.body().build())
  ).resolves.toBe(notebook.description);

  await page.click(List.new("notebook").atIndex(0).title().build());

  await expect(
    page.textContent(List.new("topic").atIndex(0).title().build())
  ).resolves.toBe("General");

  for (let i = 0; i < notebook.topics.length; ++i) {
    let topic = notebook.topics[i];
    await expect(
      page.textContent(
        List.new("topic")
          .atIndex(i + 1)
          .title()
          .build()
      )
    ).resolves.toBe(topic);
  }

  await page.click(getTestId("go-back"));

  return notebookIdBuilder.build();
}

async function createNotebookAndCheckPresence(notebook = NOTEBOOK) {
  await navigateTo("notebooks");

  await createNotebook(notebook);

  return await checkNotebookPresence(notebook);
}

async function deleteNotebookAndCheckAbsence(notebookSelector) {
  await openContextMenu(notebookSelector);

  await page.click(Menu.new("menuitem").item("delete").build());

  await confirmDialog();

  await page.waitForTimeout(500);

  await expect(page.$(notebookSelector)).resolves.toBeFalsy();

  await navigateTo("trash");

  await expect(
    isPresent(List.new("trash").atIndex(0).build())
  ).resolves.toBeTruthy();

  await expect(
    page.textContent(List.new("trash").atIndex(0).title().build())
  ).resolves.toBe(NOTEBOOK.title);

  await expect(
    page.textContent(List.new("trash").atIndex(0).body().build())
  ).resolves.toBe(NOTEBOOK.description);

  await navigateTo("notebooks");
}

test("create a notebook", createNotebookAndCheckPresence);

test("create a note inside a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await page.click(notebookSelector);

  await page.click(List.new("topic").atIndex(1).build());

  await createNoteAndCheckPresence();
});

test("edit a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await useContextMenu(notebookSelector, () => clickMenuItem("edit"));

  const notebook = {
    title: "An Edited Notebook",
    description: "A new edited description",
    topics: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  };

  await page.fill(getTestId("and-name"), notebook.title);

  await page.fill(getTestId("and-description"), notebook.description);

  for (var i = 1; i <= notebook.topics.length; ++i) {
    let id = getTestId(`and-topic-${i}-actions-edit`);
    let topic = notebook.topics[i - 1];
    if ((await page.$(id)) !== null) {
      await page.click(id);
    }
    await page.fill(getTestId("and-topic"), topic);
    await page.click(getTestId("and-topic-action"));
  }

  await confirmDialog();

  await page.waitForTimeout(1000);

  await checkNotebookPresence(notebook);
});

test("edit topics individually", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await page.click(notebookSelector);

  for (let index = 1; index < 4; index++) {
    await openContextMenu(List.new("topic").atIndex(index).build());

    await page.click(Menu.new("menuitem").item("edit").build());

    const editedTopicTitle = "Topic " + index + " edit 1";
    await page.fill(getTestId("dialog-edit-topic"), editedTopicTitle);

    await page.click(getTestId("dialog-yes"));

    await page.waitForTimeout(500);

    await expect(
      page.textContent(List.new("topic").atIndex(index).title().build())
    ).resolves.toBe(editedTopicTitle);
  }
});

test("delete a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await deleteNotebookAndCheckAbsence(notebookSelector);
});

test("permanently delete a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await deleteNotebookAndCheckAbsence(notebookSelector);

  await navigateTo("trash");

  await openContextMenu(List.new("trash").atIndex(0).build());

  await clickMenuItem("delete");

  await confirmDialog();

  await expect(
    page.$(List.new("trash").atIndex(0).build())
  ).resolves.toBeFalsy();
});

test("pin a notebook", async () => {
  const notebookSelector = await createNotebookAndCheckPresence();

  await useContextMenu(notebookSelector, () => clickMenuItem("pin"));

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  await useContextMenu(notebookSelector, () =>
    expect(
      isPresent(Menu.new("menuitem").item("unpin").build())
    ).resolves.toBeTruthy()
  );

  // wait for the menu to properly close
  await page.waitForTimeout(500);

  const notebook = await page.$(List.new("notebook").atIndex(0).build());
  await expect(notebook.screenshot()).resolves.toMatchImageSnapshot({
    failureThreshold: 5,
    failureThresholdType: "percent",
    allowSizeMismatch: true,
  });
});
