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
import { TestBuilder } from "./utils";

describe("NOTE TESTS", () => {
  it("Create a note in editor", async () => {
    await TestBuilder.create().prepare().createNote().run();
  });

  it("Open and close a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.ids.note.get(0))
      .exitEditor()
      .run();
  });

  it("Note history is created", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test note", "This is a test note")
      .waitAndTapById(notesnook.listitem.menu)
      .wait()
      .waitAndTapById("icon-history")
      .isNotVisibleByText("No note history available for this device.")
      .run();
  });

  it("Duplicate note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test note", "This is a test note")
      .waitAndTapById(notesnook.listitem.menu)
      .wait()
      .waitAndTapById("icon-duplicate")
      .isVisibleByText("Test note (Copy)")
      .run();
  });

  it("Archive a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Test note")
      .saveResult()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-archive")
      .pressBack()
      .navigate("Archive")
      .isVisibleByText("Test note")
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-archive")
      .pressBack()
      .isNotVisibleByText("Test note")
      .navigate("Notes")
      .isVisibleByText("Test note")
      .run();
  });

  it("Notes properties should show", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .isVisibleByText("Created at")
      .run();
  });

  it("Favorite and unfavorite a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .saveResult()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-favorite")
      .pressBack()
      .isVisibleById("icon-star")
      .navigate("Favorites")
      .processResult(async (note) => {
        await TestBuilder.create()
          .isVisibleByText(note.body)
          .waitAndTapById(notesnook.listitem.menu)
          .wait(500)
          .waitAndTapById("icon-favorite")
          .pressBack()
          .isNotVisibleByText(note.body)
          .navigate("Notes")
          .run();
      })
      .run();
  });

  it("Pin a note to top", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-pin")
      .pressBack()
      .isVisibleByText("PINNED")
      .isVisibleById("icon-pinned")
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-pin")
      .pressBack()
      .isNotVisibleByText("icon-pinned")
      .run();
  });

  it.skip("Pin a note in notifications", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .waitAndTapById("icon-pin-to-notifications")
      .isVisibleByText("Unpin from notifications")
      .waitAndTapById("icon-pin-to-notifications")
      .isVisibleByText("Pin to notifications")
      .run();
  });

  it("Copy note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .isVisibleById("icon-copy")
      .waitAndTapById("icon-copy")
      .run();
  });

  it("Assign colors to a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .saveResult()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Add color")
      .typeTextById("color-title-input", "Test color")
      .waitAndTapByText("Add color")
      .isVisibleById("icon-check")
      .waitAndTapById("icon-color-#efefef")
      .isNotVisibleById("icon-check")
      .waitAndTapById("icon-color-#efefef")
      .pressBack()
      .navigate("Test color")
      .processResult(async (note) => {
        await TestBuilder.create().isVisibleByText(note.body).run();
      })
      .run();
  });

  it("Delete & restore a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-trash")
      .navigate("Trash")
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Restore")
      .pressBack()
      .isVisibleByText(
        "Test note description that is very long and should not fit in text."
      )
      .run();
  });
});
