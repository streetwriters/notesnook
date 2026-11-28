import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  chooseSection,
  clickId,
  closeWithEscape,
  count,
  expectSettings,
  clickSettingControl,
  settingControl,
  openSettings,
  settle,
  start
} from "./dialogs";
import { dataSections } from "./settings-sections";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({ seedUser: { plan: "pro" } });
  await openSettings(app);
});

afterAll(async () => {
  await app.close();
});

describe.each(dataSections)("$title section", (section) => {
  test("lists its settings", async () => {
    await chooseSection(app, section.title);
    await expectSettings(app, section.keys);
  });
});

test("the vault section opens the create vault password dialog", async () => {
  await chooseSection(app, "Vault");
  await clickSettingControl(app, "create-vault");
  await settle(async () => expect(await count(app, "password-dialog")).toBe(1));
  await app.press("escape");
  await settle(async () => expect(await count(app, "password-dialog")).toBe(0));
});

test("the privacy toggle flips its checked state", async () => {
  await chooseSection(app, "Privacy");
  await expectSettings(app, ["hide-note-title"]);
  const before = (await settingControl(app, "hide-note-title")).state.checked;
  expect(typeof before).toBe("boolean");
  await clickSettingControl(app, "hide-note-title");
  await settle(async () =>
    expect((await settingControl(app, "hide-note-title")).state.checked).toBe(
      !before
    )
  );
});

test("escape closes the settings dialog", async () => {
  await closeWithEscape(app, "settings-navigation-menu");
});
