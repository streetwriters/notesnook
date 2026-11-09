import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";
import { navClick, navVisible } from "./nav";

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps: {
      resetConfig: true,
      seedNotebooks: [
        {
          title: "Projects",
          children: [
            { title: "Alpha", children: [{ title: "Alpha spec" }] },
            { title: "Beta" }
          ]
        },
        { title: "Personal" }
      ]
    },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () => expect(await app.getByTestId("app").count()).toBeGreaterThan(0),
    { timeout: 90000, interval: 500 }
  );
  await vi.waitFor(
    async () =>
      expect(await app.getByTestId("tab-notebooks").count()).toBeGreaterThan(0),
    { timeout: 30000, interval: 200 }
  );
  await app.getByTestId("tab-notebooks").click();
  await app.waitForIdle();
});

afterAll(async () => {
  await app.close();
});

const expander = async (row: number) => {
  const all = await app.query("testID", "notebook-expand", true);
  all.sort(
    (a: { frame: { y: number } }, b: { frame: { y: number } }) =>
      a.frame.y - b.frame.y
  );
  await app.click(all[row].tag);
};
const shown = (title: string) => navVisible(app, title);
const settle = async (check: () => Promise<void>) =>
  vi.waitFor(check, { timeout: 20000, interval: 300 });

test("root notebooks are listed collapsed, with an expander only where there are children", async () => {
  await settle(async () => {
    expect(await shown("Projects")).toBe(true);
    expect(await shown("Personal")).toBe(true);
  });
  expect(await shown("Alpha")).toBe(false);
  const expanders = await app.query("testID", "notebook-expand", true);
  expect(expanders).toHaveLength(1);
});

test("expanding a notebook shows its children, and collapsing hides them again", async () => {
  await expander(0);
  await settle(async () => {
    expect(await shown("Alpha")).toBe(true);
    expect(await shown("Beta")).toBe(true);
  });
  await expander(0);
  await settle(async () => expect(await shown("Alpha")).toBe(false));
  expect(await shown("Personal")).toBe(true);
});

test("nested levels expand independently and indent one level per depth", async () => {
  await expander(0);
  await settle(async () => expect(await shown("Alpha")).toBe(true));
  await settle(async () =>
    expect(
      (
        await app.query("testID", "notebook-expand", true)
      ).length
    ).toBeGreaterThanOrEqual(2)
  );
  await app.waitForIdle();
  await expander(1);
  await settle(async () => expect(await shown("Alpha spec")).toBe(true));
  const rows = await app.query("testID", "title", true);
  const x = (text: string) =>
    rows.find((row: { text?: string }) => row.text === text)?.frame.x;
  expect(x("Beta")).toBe(x("Alpha"));
  expect(x("Alpha spec")! - x("Alpha")!).toBe(11);
});

test("pressing a notebook opens it", async () => {
  await navClick(app, "Personal");
  await settle(async () =>
    expect(await app.getByTestId("notebook-title").textContent()).toBe(
      "Personal"
    )
  );
});
