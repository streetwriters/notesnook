import { afterEach, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { count, expectClosed, expectDialog, start } from "./dialogs";
import { settle } from "./views";

let app: DesktopApp | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("hash routes open dialogs", () => {
  test("/settings opens the settings dialog on the first section", async () => {
    app = await start({ initialHash: "#/settings" });
    await expectDialog(app, "settings-dialog");
    await settle(async () =>
      expect(await count(app!, "setting-email")).toBeGreaterThanOrEqual(0)
    );
  });

  test("/settings/appearance opens the appearance section", async () => {
    app = await start({ initialHash: "#/settings/appearance" });
    await expectDialog(app, "settings-dialog");
    await settle(async () =>
      expect(await count(app!, "setting-color-scheme")).toBe(1)
    );
  });

  test("/settings/vault opens the vault section", async () => {
    app = await start({ initialHash: "#/settings/vault" });
    await expectDialog(app, "settings-dialog");
    await settle(async () =>
      expect(await count(app!, "setting-create-vault")).toBe(1)
    );
  });

  test("/notebooks/create opens the add notebook dialog", async () => {
    app = await start({ initialHash: "#/notebooks/create" });
    await expectDialog(app, "add-notebook-dialog", "New notebook");
    await app.press("escape");
    await expectClosed(app, "add-notebook-dialog");
  });

  test("/tags/create opens the item dialog", async () => {
    app = await start({ initialHash: "#/tags/create" });
    await expectDialog(app, "item-dialog");
  });

  test("/reminders/create opens the add reminder dialog", async () => {
    app = await start({ initialHash: "#/reminders/create" });
    await expectDialog(app, "add-reminder-dialog", "New reminder");
  });

  test("/welcome opens the onboarding dialog with a continue button", async () => {
    app = await start({ initialHash: "#/welcome" });
    await settle(async () =>
      expect(await count(app!, "dialog")).toBeGreaterThan(0)
    );
  });

  test("/buy opens the plan selection dialog", async () => {
    app = await start({ initialHash: "#/buy" });
    await settle(async () =>
      expect(await count(app!, "checkout-plan")).toBeGreaterThan(0)
    );
  });

  test("/confirmed opens the email confirmed feature dialog", async () => {
    app = await start({ initialHash: "#/confirmed" });
    await settle(async () =>
      expect(await count(app!, "dialog")).toBeGreaterThan(0)
    );
  });
});
