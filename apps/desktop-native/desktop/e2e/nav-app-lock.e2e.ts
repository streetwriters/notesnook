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

const PIN = "1234";
let app: DesktopApp;

beforeAll(async () => {
  app = await start({ softAuthenticatorPin: PIN });
  await openSettings(app);
  await chooseSection(app, "App lock");
});

afterAll(async () => {
  await app.close();
});

describe("app lock with the soft authenticator", () => {
  test("the app lock section lists its settings", async () => {
    await settle(async () =>
      expect(await count(app, "setting-enable-app-lock")).toBe(1)
    );
  });

  test("registering a security key asks for a name then the key PIN", async () => {
    await clickId(app, "setting-security-key-button-0");
    await expectDialog(app, "dialog");
    await typeInto(app, "prompt-input", "tester");
    await clickId(app, "dialog-yes");
    await settle(async () =>
      expect(await count(app, "password-dialog")).toBe(0)
    );
    await typeInto(app, "pin", PIN);
    await clickId(app, "dialog-yes");
    await expectClosed(app, "password-dialog");
  });

  test("a wrong PIN shows the retries message and keeps the dialog open", async () => {
    await clickId(app, "setting-security-key-button-0");
    await typeInto(app, "pin", "0000");
    await clickId(app, "dialog-yes");
    await settle(async () =>
      expect(await count(app, "password-dialog")).toBe(1)
    );
    await clickId(app, "dialog-no");
  });

  test("locking the app shows the unlock view and the PIN unlocks it", async () => {
    await app.press("escape");
    await clickId(app, "lock-app");
    await settle(async () =>
      expect(await count(app, "app-lock-security-key-pin")).toBe(1)
    );
    await typeInto(app, "app-lock-security-key-pin", PIN);
    await app.press("enter");
    await settle(async () =>
      expect(await count(app, "app")).toBeGreaterThan(0)
    );
    expect(await count(app, "app-lock-security-key-pin")).toBe(0);
  });
});
