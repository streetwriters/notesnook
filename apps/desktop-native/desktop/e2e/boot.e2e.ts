import { afterAll, beforeAll, expect, test } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    initialProps: { screen: "demo" },
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG
  });
});

afterAll(async () => {
  await app.close();
});

test("boots the database and reads the user state", async () => {
  const state = app.getByTestId("boot-state");
  await expect
    .poll(async () => state.textContent(), { timeout: 60000 })
    .toMatch(/^(Logged out|Logged in as .+)$/);
  await expect(app.getByTestId("boot-info").textContent()).resolves.toMatch(
    /^Notesnook \d+\.\d+\.\d+ \((online|offline)\)$/
  );
});
