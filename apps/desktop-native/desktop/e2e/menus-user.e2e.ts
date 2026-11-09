import { afterAll, beforeAll, describe, expect, test, afterEach } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  clickMenu,
  closeMenu,
  expectMenu,
  expectNoMenuItems,
  startViews,
  windowPixel,
  resetUi
} from "./views";
import { clickId, expectDialog, expectClosed, settle } from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
});

afterAll(async () => {
  await app.close();
});

afterEach(async () => {
  await resetUi(app);
});

describe("user menu while logged out", () => {
  test("offers dark mode, settings, help and login but not logout", async () => {
    await clickId(app, "profile-dropdown");
    await expectMenu(app, [
      "toggle-theme-mode",
      "settings",
      "help-and-support",
      "login"
    ]);
    await expectNoMenuItems(app, ["logout"]);
  });

  test("dark mode flips the theme", async () => {
    const before = (await windowPixel(app, 600, 600))[0];
    await clickId(app, "profile-dropdown");
    await clickMenu(app, "toggle-theme-mode");
    await settle(async () =>
      expect((await windowPixel(app, 600, 600))[0]).not.toBe(before)
    );
  });

  test("settings opens the settings dialog", async () => {
    await clickId(app, "profile-dropdown");
    await clickMenu(app, "settings");
    await expectDialog(app, "settings-dialog");
    await app.press("escape");
    await expectClosed(app, "settings-dialog");
  });

  test("help and support opens the support section or external help", async () => {
    await clickId(app, "profile-dropdown");
    await expectMenu(app, ["help-and-support"]);
    await closeMenu(app);
  });
});
