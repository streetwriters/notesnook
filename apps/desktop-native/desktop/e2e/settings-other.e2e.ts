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
import { otherSections } from "./settings-sections";

let app: DesktopApp;

beforeAll(async () => {
  app = await start();
  await openSettings(app);
});

afterAll(async () => {
  await app.close();
});

describe.each(otherSections)("$title section", (section) => {
  test("lists its settings", async () => {
    await chooseSection(app, section.title);
    await expectSettings(app, section.keys);
  });
});

test("the support section opens the report an issue dialog", async () => {
  await chooseSection(app, "Help and support");
  await clickId(app, "setting-report-issue-button-0");
  await settle(async () =>
    expect(await count(app, "dialog")).toBeGreaterThan(0)
  );
  await app.press("escape");
});

test("escape closes the settings dialog", async () => {
  await closeWithEscape(app, "settings-dialog");
});
