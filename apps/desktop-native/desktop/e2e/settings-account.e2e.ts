import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  chooseSection,
  clickId,
  closeWithEscape,
  count,
  expectSettings,
  openSettings,
  settle,
  start
} from "./dialogs";
import { accountSections } from "./settings-sections";

let app: DesktopApp;

beforeAll(async () => {
  app = await start();
  await openSettings(app);
});

afterAll(async () => {
  await app.close();
});

describe.each(accountSections)("$title section", (section) => {
  test("lists its settings", async () => {
    await chooseSection(app, section.title);
    await expectSettings(app, section.keys);
  });
});

test("the profile section opens the confirm dialog for deleting local data", async () => {
  await chooseSection(app, "Profile");
  await clickId(app, "setting-delete-data-for-not-logged-in-user-button-0");
  await settle(async () => expect(await count(app, "confirm-dialog")).toBe(1));
  await clickId(app, "dialog-no");
  await settle(async () => expect(await count(app, "confirm-dialog")).toBe(0));
});

test("account sections stay hidden while logged out", async () => {
  for (const title of ["Subscription details", "Authentication", "Sync"]) {
    const titles = (await app.query("testID", "title", true)).map(
      (entry: { text?: string }) => entry.text
    );
    expect(titles).not.toContain(title);
  }
});

test("escape closes the settings dialog", async () => {
  await closeWithEscape(app, "settings-dialog");
});
