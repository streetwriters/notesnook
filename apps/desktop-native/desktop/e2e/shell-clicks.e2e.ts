/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { afterAll, beforeAll, expect, test } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import {
  count,
  goTo,
  navClick,
  openTab,
  plainClick,
  settle,
  startViews,
  texts
} from "./views";

let app: DesktopApp;

beforeAll(async () => {
  app = await startViews();
});

afterAll(async () => {
  await app.close();
});

test("a click without movement on a note row opens the note in a tab", async () => {
  await goTo(app, "Notes");
  await plainClick(app, "Grocery list");
  await settle(async () =>
    expect(await texts(app, "tab-title")).toContain("Grocery list")
  );
});

test("a click without movement on a sidebar row navigates to the route", async () => {
  await goTo(app, "Notes");
  await navClick(app, "Favorites");
  await settle(async () =>
    expect(await app.getByTestId("route-title").textContent()).toBe("Favorites")
  );
});

test("a click without movement on a tag opens the tag's notes", async () => {
  await openTab(app, "tags");
  await settle(async () => expect(await count(app, "tags")).toBe(1));
  const entry = (await app.query("testID", "title", true)).find(
    (candidate: { text?: string; frame: { x: number } }) =>
      candidate.text === "urgent" && candidate.frame.x < 250
  );
  if (!entry) throw new Error("tag row not found");
  await app.click(entry.tag);
  await settle(async () =>
    expect(await texts(app, "title")).toContain("Pinned plan")
  );
});
