import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  chooseSection,
  clickId,
  count,
  expectClosed,
  expectDialog,
  openSettings,
  settle,
  start,
  typeInto
} from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await start();
  await openSettings(app);
});

afterAll(async () => {
  await app.close();
});

describe("password dialog (create vault)", () => {
  test("opens from the vault settings with a password field and buttons", async () => {
    await chooseSection(app, "Vault");
    await clickId(app, "setting-create-vault-button-0");
    await expectDialog(app, "password-dialog");
    expect(await count(app, "password")).toBeGreaterThan(0);
    expect(await count(app, "dialog-yes")).toBe(1);
    expect(await count(app, "dialog-no")).toBe(1);
  });

  test("cancel closes it", async () => {
    await clickId(app, "dialog-no");
    await expectClosed(app, "password-dialog");
  });

  test("submitting a password creates the vault", async () => {
    await clickId(app, "setting-create-vault-button-0");
    await expectDialog(app, "password-dialog");
    await typeInto(app, "password", "correct horse battery");
    await clickId(app, "dialog-yes");
    await expectClosed(app, "password-dialog");
    await settle(async () =>
      expect(await count(app, "setting-lock-vault-after")).toBeGreaterThan(0)
    );
  });
});

describe("confirm dialog (delete local data)", () => {
  test("opens with a title, message and both buttons", async () => {
    await chooseSection(app, "Profile");
    await clickId(app, "setting-delete-data-for-not-logged-in-user-button-0");
    await expectDialog(app, "confirm-dialog");
    expect(await count(app, "dialog-yes")).toBe(1);
    expect(await count(app, "dialog-no")).toBe(1);
  });

  test("escape dismisses without deleting", async () => {
    await app.press("escape");
    await expectClosed(app, "confirm-dialog");
    expect(await count(app, "settings-dialog")).toBe(1);
  });
});

describe("progress and prompt dialogs", () => {
  test("backup creation shows no stuck progress dialog afterwards", async () => {
    await chooseSection(app, "Backup & export");
    await clickId(app, "setting-create-backup-button-0");
    await settle(async () =>
      expect(await count(app, "progress-dialog")).toBe(0)
    );
  });
});
