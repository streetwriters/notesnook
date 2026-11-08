import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { navClick } from "./nav";
import {
  clickId,
  closeWithBackdrop,
  closeWithEscape,
  count,
  expectClosed,
  expectDialog,
  openCommandPalette,
  seedNotes,
  settle,
  start,
  texts,
  typeInto
} from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({ seed: seedNotes });
});

afterAll(async () => {
  await app.close();
});

describe("add notebook dialog", () => {
  test("opens from the notebooks tab with its title and buttons", async () => {
    await clickId(app, "tab-notebooks");
    await clickId(app, "create-notebook-button");
    await expectDialog(app, "add-notebook-dialog", "New notebook");
    expect(await count(app, "title-input")).toBe(1);
    expect(await count(app, "description-input")).toBe(1);
    expect(await count(app, "dialog-yes")).toBe(1);
    expect(await count(app, "dialog-no")).toBe(1);
  });

  test("escape closes it without creating anything", async () => {
    await closeWithEscape(app, "add-notebook-dialog");
  });

  test("submitting a title creates the notebook", async () => {
    await clickId(app, "create-notebook-button");
    await expectDialog(app, "add-notebook-dialog");
    await typeInto(app, "title-input", "Projects");
    await clickId(app, "dialog-yes");
    await expectClosed(app, "add-notebook-dialog");
    await settle(async () => expect(await texts(app)).toContain("Projects"));
  });

  test("the cancel button closes it", async () => {
    await clickId(app, "create-notebook-button");
    await expectDialog(app, "add-notebook-dialog");
    await clickId(app, "dialog-no");
    await expectClosed(app, "add-notebook-dialog");
  });
});

describe("create tag dialog (item dialog)", () => {
  test("opens from the tags tab and creates a tag", async () => {
    await clickId(app, "tab-tags");
    await clickId(app, "create-tag-button");
    await expectDialog(app, "item-dialog");
    await typeInto(app, "title-input", "groceries");
    await clickId(app, "dialog-yes");
    await expectClosed(app, "item-dialog");
    await settle(async () => expect(await texts(app)).toContain("groceries"));
  });

  test("the backdrop closes it", async () => {
    await clickId(app, "create-tag-button");
    await expectDialog(app, "item-dialog");
    await closeWithBackdrop(app, "item-dialog");
  });
});

describe("command palette dialog", () => {
  test("opens from the action bar and escape closes it", async () => {
    await openCommandPalette(app);
    expect(await count(app, "dialog-title")).toBe(0);
    await app.press("escape");
    await expectClosed(app, "dialog");
  });

  test("typing filters notes and enter opens one", async () => {
    await openCommandPalette(app);
    await typeInto(app, "dialog", "Apple");
    await settle(async () =>
      expect((await texts(app)).some((text) => text?.startsWith("Apple"))).toBe(
        true
      )
    );
    await app.press("enter");
    await expectClosed(app, "dialog");
  });
});

describe("add reminder dialog", () => {
  test("opens from the reminders list with its sections and closes with escape", async () => {
    await navClick(app, "Reminders");
    await clickId(app, "reminders-action-button");
    await expectDialog(app, "add-reminder-dialog", "New reminder");
    expect(await count(app, "title-input")).toBe(1);
    expect(await count(app, "description-input")).toBe(1);
    expect(await count(app, "mode-once")).toBe(1);
    expect(await count(app, "priority-vibrate")).toBe(1);
    await closeWithEscape(app, "add-reminder-dialog");
  });

  test("choosing repeat shows the recurring modes", async () => {
    await clickId(app, "reminders-action-button");
    await expectDialog(app, "add-reminder-dialog");
    await clickId(app, "mode-repeat");
    await settle(async () =>
      expect(await count(app, "recurring-mode-week")).toBe(1)
    );
    await clickId(app, "dialog-no");
    await expectClosed(app, "add-reminder-dialog");
  });
});
