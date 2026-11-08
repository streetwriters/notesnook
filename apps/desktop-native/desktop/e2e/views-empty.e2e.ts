import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { clickId, count, settle, start } from "./dialogs";
import { goTo, openTab } from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await start({ seed: [], seedNotebooks: [], seedTags: [] });
});

afterAll(async () => {
  await app.close();
});

describe.each(["Notes", "Favorites", "Archive", "Trash", "Reminders"])(
  "%s empty state",
  (route) => {
    test("shows the list placeholder and no rows", async () => {
      await goTo(app, route);
      await settle(async () =>
        expect(await count(app, "list-placeholder")).toBe(1)
      );
      expect(await count(app, "list-item")).toBe(0);
    });
  }
);

test("the notebooks tab shows its empty state", async () => {
  await openTab(app, "notebooks");
  await settle(async () =>
    expect(await count(app, "notebooks-placeholder")).toBe(1)
  );
});

test("the tags tab shows an empty placeholder", async () => {
  await clickId(app, "tab-tags");
  await settle(async () =>
    expect(await count(app, "tags-placeholder")).toBe(1)
  );
});
