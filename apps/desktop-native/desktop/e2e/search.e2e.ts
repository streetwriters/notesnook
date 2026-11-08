import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { launchApp } from "./launch";

const NOW = Date.now();
const seed = [
  { title: "Apple pie", content: "Bake the apple pie slowly" },
  { title: "Garden", content: "Water the plants" },
  { title: "Apple notes", content: "Nothing about fruit here" }
].map((note, index) => ({
  ...note,
  dateEdited: NOW - index * 60000,
  dateCreated: NOW - index * 60000
}));

let app: DesktopApp;

beforeAll(async () => {
  app = await launchApp({
    disableAnimations: true,
    timeout: 180000,
    initialProps: { seed, resetConfig: true },
    env: {
      RN_GPUI_APP_DATA_DIR: mkdtempSync(path.join(tmpdir(), "notesnook-e2e-"))
    }
  });
  await vi.waitFor(
    async () =>
      expect((await app.query("testID", "list-item", true)).length).toBe(3),
    { timeout: 90000, interval: 500 }
  );
});

afterAll(async () => {
  await app.close();
});

const settle = (check: () => Promise<void>) =>
  vi.waitFor(check, { timeout: 20000, interval: 300 });

const input = async () => (await app.query("testID", "search-input", true))[0];

test("typing a query lists matching notes as expandable search results", async () => {
  const field = await input();
  await app.click(field.tag);
  await app.typeText(field.tag, "apple");
  await settle(async () => {
    const titles = (await app.query("testID", "title", true)).map(
      (entry: { text?: string }) => entry.text
    );
    expect(titles).not.toContain("Garden");
    expect(titles.some((text) => text?.startsWith("Apple"))).toBe(true);
  });
  expect(
    (await app.query("testID", "search-result-expand", true)).length
  ).toBeGreaterThan(0);
});

test("the clear button resets the search and restores every note", async () => {
  await app.getByTestId("search-button").click();
  await settle(async () =>
    expect((await app.query("testID", "list-item", true)).length).toBe(3)
  );
  expect(await app.query("testID", "search-button", true)).toHaveLength(0);
});

test("a query without matches shows the search placeholder", async () => {
  const field = await input();
  await app.click(field.tag);
  await app.typeText(field.tag, "zzzqq");
  await settle(async () =>
    expect(
      (
        await app.query("testID", "list-placeholder", true)
      ).length
    ).toBeGreaterThan(0)
  );
});
