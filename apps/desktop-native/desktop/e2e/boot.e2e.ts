import { afterAll, beforeAll, expect, test } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG
  });
});

afterAll(async () => {
  await app.close();
});

test("shows the placeholder", async () => {
  await app.waitForIdle({ ignore: ["animations"] });
  const tree = JSON.stringify(await app.tree());
  expect(tree).toContain("Notesnook");
});
