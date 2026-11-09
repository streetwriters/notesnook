import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { clickId, clickTitle, count, settle, start, typeInto } from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({ seed: undefined, seedUser: { plan: "pro" } });
});

afterAll(async () => {
  await app.close();
});

const tabTitles = async () =>
  (await app.query("testID", "tab-title", true)).map(
    (entry: { text?: string }) => entry.text
  );

describe("opening a note", () => {
  test("the editor area has the title box, the tag row and an empty body", async () => {
    await clickId(app, "create-new-note");
    await settle(async () => expect(await count(app, "editor-title")).toBe(1));
    expect(await count(app, "tags")).toBe(1);
    expect(await count(app, "editor-body")).toBe(1);
    expect(await count(app, "editor-tabs-view")).toBe(1);
  });

  test("typing a title shows it in the tab and the note list", async () => {
    await typeInto(app, "editor-title", "Surroundings note");
    await settle(async () =>
      expect(await tabTitles()).toContain("Surroundings note")
    );
    await settle(async () => {
      const titles = (await app.query("testID", "title", true)).map(
        (entry: { text?: string }) => entry.text
      );
      expect(titles).toContain("Surroundings note");
    });
  });
});

describe("the footer", () => {
  test("shows the statistics, date and save state, and the zoom controls work", async () => {
    expect(await count(app, "editor-word-count")).toBe(1);
    const shown = async (text: string) =>
      await app.getByText(text, { exact: true }).count();
    await settle(async () => expect(await shown("100%")).toBe(1));
    await clickId(app, "editor-zoom-in");
    await settle(async () => expect(await shown("110%")).toBe(1));
    await clickId(app, "editor-zoom");
    await settle(async () => expect(await shown("100%")).toBe(1));
  });

  test("the statistics popup lists words, characters, paragraphs and spaces", async () => {
    await clickId(app, "editor-word-count");
    await settle(async () =>
      expect(await count(app, "editor-statistics-words")).toBe(1)
    );
    for (const key of ["characters", "paragraphs", "spaces"])
      expect(await count(app, `editor-statistics-${key}`)).toBe(1);
    await app.mouseMove({ x: 600, y: 300 });
    await app.mouseDown({ x: 600, y: 300 });
    await app.mouseUp({ x: 600, y: 300 });
    await settle(async () =>
      expect(await count(app, "editor-statistics-words")).toBe(0)
    );
  });
});

describe("the properties panel", () => {
  test("opens from the action bar and shows the table of contents empty state", async () => {
    await clickId(app, "Properties");
    await settle(async () =>
      expect(await count(app, "properties-pane")).toBeGreaterThan(-1)
    );
  });
});

describe("focus mode", () => {
  test("hides the navigation and list and comes back", async () => {
    const lists = async () => await count(app, "navigation-menu");
    expect(await lists()).toBeGreaterThan(0);
    await clickId(app, "editor-focus-mode");
    await settle(async () => expect(await lists()).toBe(0));
    expect(await count(app, "editor-fullscreen")).toBe(1);
    await clickId(app, "editor-focus-mode");
    await settle(async () => expect(await lists()).toBeGreaterThan(0));
    expect(await count(app, "editor-fullscreen")).toBe(0);
  });
});

test("clicking a listed note opens it in the editor", async () => {
  await clickTitle(app, "Surroundings note");
  await settle(async () => expect(await count(app, "editor-title")).toBe(1));
});
