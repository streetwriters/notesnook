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

import { notesnook } from "../test.ids";
import {
  navigate,
  tapById,
  visibleByText,
  createNote,
  prepare,
  visibleById,
  notVisibleById,
  sleep,
  exitEditor,
  tapByText
} from "./utils";

describe("NOTE TESTS", () => {
  it("Create a note in editor", async () => {
    await prepare();
    await createNote();
  });

  it("Open and close a note", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.ids.note.get(1));
    await exitEditor();
  });

  it("Notes properties should show", async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await visibleByText("Created at:");
  });

  it("Favorite and unfavorite a note", async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-favorite");
    await visibleById("icon-star");
    await navigate("Favorites");
    await visibleByText(note.body);
    await sleep(500);
    await tapById(notesnook.listitem.menu);
    await tapById("icon-favorite");
    await expect(element(by.text(note.body))).not.toBeVisible();
    await navigate("Notes");
  });

  it("Pin a note to top", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-pin");
    await visibleByText("Pinned");
    await visibleById("icon-pinned");
    await tapById(notesnook.listitem.menu);
    await tapById("icon-pin");
    expect(element(by.id("icon-pinned"))).not.toBeVisible();
  });

  it("Pin a note in notifications", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-pin-to-notifications");
    await visibleByText("Unpin from notifications");
    await sleep(500);
    await tapById("icon-pin-to-notifications");
    await sleep(500);
    await visibleByText("Pin to notifications");
  });

  // it("Copy note", async () => {
  //   await prepare();
  //   await createNote();
  //   await tapById(notesnook.listitem.menu);
  //   await tapById("icon-Copy");
  //   await visibleByText("Note copied to clipboard");
  // });

  it("Export note dialog should show", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-export");
    await visibleByText("PDF");
  });

  it("Assign colors to a note", async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById(notesnook.ids.dialogs.actionsheet.color("red"));
    await visibleById("icon-check");
    await tapById(notesnook.ids.dialogs.actionsheet.color("red"));
    await notVisibleById("icon-check");
    await tapById(notesnook.ids.dialogs.actionsheet.color("green"));
    await device.pressBack();
    await navigate("Green");
    await visibleByText(note.body);
  });

  it("Delete & restore a note", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapById("icon-trash");
    await navigate("Trash");
    await sleep(500);
    await tapById(notesnook.listitem.menu);
    await tapByText("Restore note");
    await device.pressBack();
    await visibleByText(
      "Test note description that is very long and should not fit in text."
    );
  });
});
