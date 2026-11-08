import { PNG } from "pngjs";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { launchApp, type DesktopApp } from "@react-native-gpui/testing";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG
  });
  await vi.waitFor(
    async () => {
      expect(await app.getByTestId("boot-state").textContent()).toMatch(
        /^(Logged out|Logged in as .+)$/
      );
    },
    { timeout: 60000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

async function color(testID: string, atX = 0.5, atY = 0.5) {
  const image = PNG.sync.read(await app.getByTestId(testID).screenshot());
  const x = Math.min(image.width - 1, Math.round(image.width * atX));
  const y = Math.min(image.height - 1, Math.round(image.height * atY));
  const offset = (y * image.width + x) * 4;
  return Array.from(image.data.subarray(offset, offset + 3));
}

function near(actual: number[], hex: string, tolerance = 3) {
  const expected = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return actual.every(
    (channel, i) => Math.abs(channel - expected[i]) <= tolerance
  );
}

async function expectColor(testID: string, hex: string, atX = 0.5, atY = 0.5) {
  await expect
    .poll(async () => near(await color(testID, atX, atY), hex), {
      message: `${testID} should be ${hex}`,
      timeout: 5000
    })
    .toBe(true);
}

async function centre(testID: string) {
  const [node] = await app.query("testID", testID, true);
  const top = (await app.menuBarState()).inset;
  return {
    x: node.frame.x + node.frame.width / 2,
    y: node.frame.y + node.frame.height / 2 + top
  };
}

async function away() {
  await app.mouseMove({ x: 4, y: 4 });
  await app.waitForIdle();
}

async function renders() {
  return app.getByTestId("renders").textContent();
}

const LIGHT = { background: "#ffffff", secondary: "#f7f7f7", hover: "#eeeeee" };
const DARK = { background: "#181818", secondary: "#202020", hover: "#2b2b2b" };

test("theme tokens resolve to the light theme", async () => {
  await expectColor("root", LIGHT.background, 0.05, 0.05);
  await expectColor("row", LIGHT.secondary, 0.5, 0.08);
});

test("hover and group hover change painted colours without a React render", async () => {
  await away();
  const before = await renders();
  await expectColor("row", LIGHT.secondary, 0.5, 0.08);
  await expectColor("row", LIGHT.secondary, 0.93, 0.5);

  await app.mouseMove(await centre("row"));
  await app.waitForIdle();
  await expectColor("row", LIGHT.hover, 0.5, 0.08);
  await expectColor("row", "#008837", 0.93, 0.5);

  await away();
  await expectColor("row", LIGHT.secondary, 0.5, 0.08);
  expect(await renders()).toBe(before);
});

test("switching the colour scheme resolves the dark theme", async () => {
  await app.getByTestId("toggle-scheme").click();
  await app.waitForIdle();
  await expectColor("root", DARK.background, 0.05, 0.05);
  await expectColor("row", DARK.secondary, 0.5, 0.08);

  await app.mouseMove(await centre("row"));
  await app.waitForIdle();
  await expectColor("row", DARK.hover, 0.5, 0.08);
  await away();
});

test("the input reports its text", async () => {
  await app.getByTestId("input").type("hello");
  await expect
    .poll(async () => app.getByTestId("echo").textContent())
    .toBe("hello");
});
