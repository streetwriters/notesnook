import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  chooseSection,
  clickId,
  count,
  expectClosed,
  expectDialog,
  clickSettingControl,
  openSettings,
  settle,
  start,
  typeInto
} from "./dialogs";
import { waitForShellContent } from "./launch";

const PIN = "1234";
const PASSWORD = "correct horse";
let app: DesktopApp;

beforeAll(async () => {
  app = await start(
    {
      softAuthenticatorPin: PIN,
      seedUser: { plan: "pro" },
      seedAppLockPassword: PASSWORD
    },
    false
  );
  await typeInto(app, "app-lock-password", PASSWORD);
  await clickId(app, "app-lock-submit");
  await waitForShellContent(app);
  await openSettings(app);
  await chooseSection(app, "App lock");
  // Launch, unlock and two settings steps take longer than the default hook
  // timeout on a debug build.
}, 180000);

afterAll(async () => {
  await app.close();
});

describe("app lock with the soft authenticator", () => {
  test("the app lock section lists its settings", async () => {
    await settle(async () =>
      expect(await count(app, "setting-enable-app-lock")).toBe(1)
    );
  });

  test("registering a security key asks for the app lock password then the key PIN", async () => {
    await clickSettingControl(app, "security-key");
    await typeInto(app, "password", PASSWORD);
    await clickId(app, "dialog-yes");
    await settle(async () => expect(await count(app, "pin")).toBe(1));
    await typeInto(app, "pin", PIN);
    await clickId(app, "dialog-yes");
    await expectClosed(app, "password-dialog");
  });

  test("a wrong PIN shows the retries message and closes the PIN dialog", async () => {
    app.allowErrors(/ERR_WEBAUTHN_PIN_INVALID/u);
    await clickSettingControl(app, "security-key");
    await typeInto(app, "pin", "0000");
    await clickId(app, "dialog-yes");
    await settle(async () =>
      expect(
        await app.getByText("the PIN is wrong", { exact: false }).count()
      ).toBeGreaterThan(0)
    );
    await expectClosed(app, "password-dialog");
  });

  test("locking the app shows the unlock view and the PIN unlocks it", async () => {
    await clickSettingControl(app, "security-key");
    await typeInto(app, "pin", PIN);
    await clickId(app, "dialog-yes");
    await expectClosed(app, "password-dialog");
    await app.press("escape");
    await expectClosed(app, "settings-navigation-menu");
    await clickId(app, "lock-app");
    await clickId(app, "app-lock-use-security-key");
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
