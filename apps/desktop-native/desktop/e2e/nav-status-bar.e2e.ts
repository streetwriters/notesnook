import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { count, settle } from "./dialogs";
import { startViews } from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
});

afterAll(async () => {
  await app.close();
});

describe("status bar", () => {
  test("is rendered below the panes", async () => {
    expect(await count(app, "status-bar")).toBe(1);
    const [bar] = await app.query("testID", "status-bar", true);
    const size = await app.getWindowSize();
    expect(bar.frame.y + bar.frame.height).toBeGreaterThan(size.height - 40);
  });

  test("shows a sync status entry while logged out", async () => {
    await settle(async () => {
      const entries = await app.query("testID", "status-bar", true);
      expect(entries.length).toBe(1);
    });
  });

  test("the lock button is absent without app lock and the vault indicator without an unlocked vault", async () => {
    expect(await count(app, "lock-app")).toBe(0);
    expect(await count(app, "vault-unlocked")).toBe(0);
  });
});
