import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { clickId, count, settle, start, typeInto } from "./dialogs";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({ seedUser: { plan: "pro" } });
});

afterAll(async () => {
  await app.close();
});

const tabEntries = async () =>
  (await app.query("testID", "tab-title", true)).sort(
    (a: { frame: { x: number } }, b: { frame: { x: number } }) =>
      a.frame.x - b.frame.x
  );

const tabs = async () =>
  (await tabEntries()).map((entry: { text?: string }) => entry.text);

const shown = async (text: string) =>
  await app.getByText(text, { exact: false }).count();

async function typeTitle(title: string) {
  await settle(async () => {
    const fields = await app.query("testID", "editor-title", true);
    expect(fields.length).toBe(1);
    expect((await app.getProps(fields[0].tag)).text ?? "").toBe("");
  });
  const [field] = await app.query("testID", "editor-title", true);
  await app.click(field.tag);
  await app.typeText(field.tag, title);
  await settle(async () => expect(await tabs()).toContain(title));
}

describe("tabs", () => {
  test("new notes open in their own tabs with their titles", async () => {
    await typeTitle("First tab");
    await clickId(app, "create-new-note");
    await settle(async () => expect((await tabs()).length).toBe(2));
    await typeTitle("Second tab");
    expect(await tabs()).toEqual(["First tab", "Second tab"]);
  });

  test("clicking a tab switches the editor to its note", async () => {
    const entries = await tabEntries();
    const first = entries.find(
      (entry: { text?: string }) => entry.text === "First tab"
    );
    await app.click(first.tag);
    await settle(async () => {
      const [field] = await app.query("testID", "editor-title", true);
      expect((await app.getProps(field.tag)).text).toBe("First tab");
    });
  });

  test.skip("dragging a tab onto another reorders them", async () => {
    const found: { tag: number; testID: string }[] = [];
    const walk = (node: any) => {
      if (
        node.testID?.startsWith("tab-") &&
        !/^tab-(title|icon|icon-unsaved|close-button|home|notebooks|tags)$/.test(
          node.testID
        )
      )
        found.push({ tag: node.tag, testID: node.testID });
      (node.children ?? []).forEach(walk);
    };
    walk(await app.tree());
    const titles = await tabs();
    expect(found.length).toBe(titles.length);
    await app.drag(found[1].tag, found[0].tag, { steps: 12, duration: 600 });
    await settle(async () =>
      expect(await tabs()).toEqual([...titles].reverse())
    );
  });

  test("closing a tab removes it and keeps the others", async () => {
    const before = (await tabs()).length;
    await app.press("mod-w");
    await settle(async () => expect((await tabs()).length).toBe(before - 1));
    expect(await count(app, "editor-title")).toBe(1);
  });
});

describe("properties tabs", () => {
  test("every properties tab opens and shows its content or empty state", async () => {
    await clickId(app, "Properties");
    await settle(async () =>
      expect(await count(app, "properties-tab-toc")).toBe(1)
    );
    const empty: Record<string, string> = {
      toc: "No headings found",
      "note-history": "Local only",
      attachments: "No attached files",
      reminders: "No reminders to show"
    };
    for (const [tab, text] of Object.entries(empty)) {
      await clickId(app, `properties-tab-${tab}`);
      await settle(async () =>
        expect(await shown(text), tab).toBeGreaterThan(0)
      );
    }
    await clickId(app, "properties-tab-properties");
    await settle(async () =>
      expect(await count(app, "properties-pin")).toBe(1)
    );
  });

  test("editing the title in the editor updates the tab", async () => {
    await settle(async () => {
      const fields = await app.query("testID", "editor-title", true);
      expect(fields.length).toBe(1);
      expect(
        ((await app.getProps(fields[0].tag)).text ?? "").length
      ).toBeGreaterThan(0);
    });
    await typeInto(app, "editor-title", " edited");
    await settle(async () =>
      expect((await tabs()).some((title) => title?.includes("edited"))).toBe(
        true
      )
    );
  });
});
