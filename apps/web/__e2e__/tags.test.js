/* eslint-disable react-hooks/rules-of-hooks */
const { test, expect, Page } = require("@playwright/test");
const { getTestId, createNote, NOTE } = require("./utils");
const {
  navigateTo,
  useContextMenu,
  clickMenuItem,
} = require("./utils/actions");
const { checkNotePresence } = require("./utils/conditions");
const List = require("./utils/listitemidbuilder");
const Menu = require("./utils/menuitemidbuilder");

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

async function createTag(title) {
  await navigateTo("tags");

  await page.click(getTestId("tags-action-button"));

  await page.type(getTestId("item-dialog-title"), title);

  await page.click(getTestId("dialog-yes"));
}

async function checkTagPresence(title) {
  let tagSelector = List.new("tag").view("tags").grouped().atIndex(0);

  await page.waitForSelector(tagSelector.build(), { state: "attached" });

  await expect(page.innerText(tagSelector.title().build())).resolves.toBe(
    `#${title}`
  );

  return tagSelector;
}

async function createNoteAndCheckPresence(title) {
  await createNote(NOTE, "notes");

  const noteSelector = await checkNotePresence("notes");

  expect(
    await page.isVisible(
      new List("note").view("notes").grouped().atIndex(0).tag(title).build()
    )
  ).toBe(true);

  return noteSelector;
}

async function createTagAndCheckPresence(title) {
  await createTag(title);

  return await checkTagPresence(title);
}

async function renameTag(tagSelector, newTitle, expected) {
  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("rename");
  });

  await page.fill(getTestId("item-dialog-title"), newTitle);

  await page.click(getTestId("dialog-yes"));

  await checkTagPresence(expected);
}

test("create a tag", async ({ page }) => {
  await createTagAndCheckPresence("helloworld");
});

test("edit a tag", async ({ page }) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await renameTag(tagSelector, "new world", "newworld");
});

test("delete a tag", async ({ page }) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("delete");
  });

  await page.waitForTimeout(1000);

  expect(await page.isVisible(tagSelector.build())).toBe(false);
});

test("create a note inside a tag", async ({ page }) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await page.click(tagSelector.build());

  await createNoteAndCheckPresence("helloworld");
});

test("edit a tag and make sure all its references on note are updated", async ({
  page,
}) => {
  let tagSelector = await createTagAndCheckPresence("helloworld");

  await page.click(tagSelector.build());

  await createNoteAndCheckPresence("helloworld");

  await page.click(getTestId("go-back"));

  await renameTag(tagSelector, "new world", "newworld");

  await page.click(tagSelector.build());

  expect(
    await page.isVisible(
      new List("note")
        .view("notes")
        .grouped()
        .atIndex(0)
        .tag("newworld")
        .build()
    )
  ).toBe(true);
});

test("delete a tag and make sure all associated notes are untagged", async ({
  page,
}) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await page.click(tagSelector.build());

  await createNoteAndCheckPresence("helloworld");

  await page.click(getTestId("go-back"));

  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("delete");
  });

  await page.waitForTimeout(1000);

  expect(await page.isVisible(tagSelector.build())).toBe(false);

  await navigateTo("notes");

  expect(
    await page.isVisible(
      new List("note")
        .view("notes")
        .grouped()
        .atIndex(0)
        .tag("helloworld")
        .build()
    )
  ).toBe(false);
});

test("create a shortcut of a tag", async ({ page }) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("shortcut");
  });

  expect(
    await page.isVisible(new Menu("navitem").item("helloworld").build())
  ).toBe(true);

  await navigateTo("helloworld");

  expect(await page.inputValue(getTestId("routeHeader"))).toBe("#helloworld");
});

test("delete a shortcut of a tag", async ({ page }) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("shortcut");
  });

  expect(
    await page.isVisible(new Menu("navitem").item("helloworld").build())
  ).toBe(true);

  await useContextMenu(
    new Menu("navitem").item("helloworld").build(),
    async () => {
      await clickMenuItem("removeshortcut");
    }
  );

  expect(
    await page.isVisible(new Menu("navitem").item("helloworld").build())
  ).toBe(false);
});

test("delete the last note of a tag that is also a shortcut", async ({
  page,
}) => {
  const tagSelector = await createTagAndCheckPresence("helloworld");

  await useContextMenu(tagSelector.build(), async () => {
    await clickMenuItem("shortcut");
  });

  await page.click(tagSelector.build());

  const noteSelector = await createNoteAndCheckPresence("helloworld");

  await useContextMenu(noteSelector, async () => {
    await clickMenuItem("movetotrash");
  });

  await page.waitForTimeout(1000);

  expect(await page.isVisible(noteSelector)).toBe(false);

  await navigateTo("notes");

  expect(await page.inputValue(getTestId("routeHeader"))).toBe("Notes");
});
