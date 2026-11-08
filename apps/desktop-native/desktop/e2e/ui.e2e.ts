import { PNG } from "pngjs";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";
import { THEME_DARK, THEME_LIGHT } from "../../src/app/common/theme";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: false,
    initialProps: { screen: "demo" },
    timeout: 180000,
    logFile: process.env.RN_GPUI_E2E_LOG,
    env: { RN_GPUI_TEST_DISPLAY: "main" }
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
  let stable = 0;
  await expect
    .poll(
      async () => {
        stable = near(await color(testID, atX, atY), hex) ? stable + 1 : 0;
        return stable >= 2;
      },
      {
        message: `${testID} should be ${hex}`,
        timeout: 5000,
        interval: 100
      }
    )
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

const hex = (value: string) =>
  /^#[0-9a-f]{3}$/i.test(value)
    ? `#${[...value.slice(1)].map((c) => c + c).join("")}`.toLowerCase()
    : value.toLowerCase();
const tokens = (theme: any) => ({
  background: hex(theme.scopes.base.primary.background),
  secondary: hex(theme.scopes.base.secondary.background),
  hover: hex(theme.scopes.base.primary.hover)
});
const LIGHT = tokens(THEME_LIGHT);
const DARK = tokens(THEME_DARK);

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

test("a transition changes the value over time", async () => {
  await expectColor("fade-parent", DARK.background);
  await app.getByTestId("toggle-fade").click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const midway = await color("fade-parent");
  expect(near(midway, DARK.background, 6), `midway ${midway}`).toBe(false);
  expect(near(midway, "#008837", 6), `midway ${midway}`).toBe(false);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await expectColor("fade-parent", "#008837");
});

test("a keyframe animation changes the value over time", async () => {
  await expectColor("spin-parent", DARK.background);
  await app.getByTestId("toggle-spin").click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  const midway = await color("spin-parent");
  expect(near(midway, DARK.background, 6), `midway ${midway}`).toBe(false);
  expect(near(midway, "#008837", 6), `midway ${midway}`).toBe(false);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await expectColor("spin-parent", "#008837");
});

test("outline colour and width are painted outside the box", async () => {
  await expectColor("outline-parent", "#008837", 0.225, 0.5);
});

test("a grid lays out equal columns with the gap between them", async () => {
  const frames = [];
  for (let index = 0; index < 6; index++) {
    const [node] = await app.query("testID", `grid-${index}`, true);
    frames.push(node.frame);
  }
  const [grid] = await app.query("testID", "grid", true);
  const width = frames[0].width;
  for (const frame of frames)
    expect(Math.abs(frame.width - width)).toBeLessThan(1);
  expect(frames[3].x).toBeCloseTo(frames[0].x, 0);
  expect(frames[4].x).toBeCloseTo(frames[1].x, 0);
  expect(Math.abs(frames[1].x - (frames[0].x + width) - 6)).toBeLessThan(1);
  expect(Math.abs(frames[2].x - (frames[1].x + width) - 6)).toBeLessThan(1);
  expect(frames[3].y).toBeGreaterThan(frames[0].y + frames[0].height);
  expect(Math.abs(width * 3 + 12 - grid.frame.width)).toBeLessThan(1);
});

test("each font weight resolves to its own Inter face", async () => {
  const widths: number[] = [];
  for (const weight of [400, 500, 600, 700]) {
    const [node] = await app.query("testID", `weight-${weight}`, true);
    widths.push(node.frame.width);
  }
  for (let index = 1; index < widths.length; index++)
    expect(widths[index]).toBeGreaterThan(widths[index - 1]);
});
