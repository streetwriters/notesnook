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

describe("Tags", () => {
  it("Create a tag", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-tags")
      .isVisibleByText("No tags")
      .waitAndTapById("sidebar-add-button")
      .typeTextById("input-value", "testtag")
      .waitAndTapByText("Add")
      .isVisibleByText("testtag")
      .run();
  });

  it("Tag a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .saveResult()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Add tag")
      .typeTextById("tag-input", "testtag")
      .waitAndTapByText('Add "#testtag"')
      .isVisibleByText("#testtag")
      .pressBack(2)
      .openSideMenu()
      .waitAndTapById("tab-tags")
      .waitAndTapByText("#testtag")
      .processResult(async (note) => {
        await TestBuilder.create().isVisibleByText(note.body).run();
      })
      .run();
  });

  it("Untag a note", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Add tag")
      .typeTextById("tag-input", "testtag")
      .waitAndTapByText('Add "#testtag"')
      .isVisibleByText("#testtag")
      .waitAndTapByText("#testtag")
      .pressBack(2)
      .isNotVisibleByText("#testtag")
      .run();
  });

  it("Create shortcut of a tag", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Add tag")
      .typeTextById("tag-input", "testtag")
      .waitAndTapByText('Add "#testtag"')
      .isVisibleByText("#testtag")
      .pressBack(2)
      .openSideMenu()
      .waitAndTapById("tab-tags")
      .longPressByText("testtag")
      .wait(500)
      .waitAndTapByText("Add shortcut")
      .waitAndTapById("tab-home")
      .isVisibleByText("testtag")
      .run();
  });

  it("Rename a tag", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapByText("Add tag")
      .typeTextById("tag-input", "testtag")
      .waitAndTapByText('Add "#testtag"')
      .isVisibleByText("#testtag")
      .pressBack(2)
      .openSideMenu()
      .waitAndTapById("tab-tags")
      .longPressByText("testtag")
      .wait(500)
      .waitAndTapByText("Rename")
      .wait(100)
      .clearTextById("input-value")
      .typeTextById("input-value", "testtag_edited")
      .waitAndTapByText("Save")
      .isVisibleByText("testtag_edited")
      .run();
  });
});
