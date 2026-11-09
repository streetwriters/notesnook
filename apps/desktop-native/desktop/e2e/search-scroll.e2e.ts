import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { count, settle, start } from "./dialogs";

let app: DesktopApp;
const NOW = Date.now();
const seed = Array.from({ length: 60 }, (_, index) => ({
  title: `Note ${index} apple`,
  content: `Body of note number ${index} about things`,
  dateEdited: NOW - index * 60000,
  dateCreated: NOW - index * 60000
}));

beforeAll(async () => {
  app = await start({ seed });
});

afterAll(async () => {
  await app.close();
});

const firstVisibleTitle = async () => {
  const list = (await app.query("testID", "virtual-list", true))[0];
  const titles = (await app.query("testID", "title", true))
    .filter(
      (entry: { text?: string; frame: { x: number; y: number } }) =>
        entry.frame.x >= list.frame.x &&
        entry.frame.x < list.frame.x + list.frame.width &&
        entry.frame.y >= list.frame.y &&
        /^Note \d+ apple$/.test(entry.text ?? "")
    )
    .sort(
      (a: { frame: { y: number } }, b: { frame: { y: number } }) =>
        a.frame.y - b.frame.y
    );
  return titles[0]?.text as string | undefined;
};

describe("scroll position through a search", () => {
  test("the list keeps its position when search starts and ends", async () => {
    await settle(async () => expect(await count(app, "virtual-list")).toBe(1));
    const list = (await app.query("testID", "virtual-list", true))[0];
    for (let step = 0; step < 10; step++) await app.scroll(list.tag, 0, -120, 6);
    await app.waitForIdle();
    const before = await firstVisibleTitle();
    expect(before).not.toBe("Note 0 apple");

    const [input] = await app.query("testID", "search-input", true);
    await app.click(input.tag);
    for (const key of "apple") await app.press(key);
    await settle(async () => expect(await firstVisibleTitle()).toBe(before));

    for (let key = 0; key < 5; key++) await app.press("backspace");
    await settle(async () =>
      expect(await count(app, "list-item")).toBeLessThan(30)
    );
    await settle(async () => expect(await firstVisibleTitle()).toBe(before));
  });
});
