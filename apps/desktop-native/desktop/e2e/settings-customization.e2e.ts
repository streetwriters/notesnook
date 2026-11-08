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
import { customizationSections } from "./settings-sections";

let app: DesktopApp;

beforeAll(async () => {
  app = await start();
  await openSettings(app);
});

afterAll(async () => {
  await app.close();
});

describe.each(customizationSections)("$title section", (section) => {
  test("lists its settings", async () => {
    await chooseSection(app, section.title);
    await expectSettings(app, section.keys);
  });
});

test("the color scheme dropdown is rendered with a selected value", async () => {
  await chooseSection(app, "Appearance");
  await expectSettings(app, ["color-scheme"]);
});

test("the servers section renders the server url fields", async () => {
  await chooseSection(app, "Servers");
  await expectSettings(app, ["config"]);
});

test("escape closes the settings dialog", async () => {
  await closeWithEscape(app, "settings-dialog");
});
