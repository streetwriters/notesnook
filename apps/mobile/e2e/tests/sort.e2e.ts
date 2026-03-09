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

describe("Sort & filter", () => {
  it("Sort by date-edited/date-created", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .createNote("Note 2", "Note 2")
      .waitAndTapByText("Note 1")
      .addStep(async () => {
        const webview = web();
        await webview.element(by.web.className("ProseMirror")).tap();
        await webview
          .element(by.web.className("ProseMirror"))
          .typeText("Edited ", true);
      })
      .pressBack(2)
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Date created")
      .pressBack()
      .waitAndTapById(notesnook.listitem.menu)
      .pressBack()
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Date edited")
      .pressBack()
      .waitAndTapById(notesnook.listitem.menu)
      .run();
  });

  it("Disable grouping", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("None")
      .pressBack()
      .isVisibleByText("ALL")
      .run();
  });

  it("Group by Abc", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Abc")
      .pressBack()
      .isVisibleByText("N")
      .run();
  });

  it("Group by Year", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Year")
      .run();
  });

  it("Group by Week", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Week")
      .run();
  });

  it("Group by Month", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-sort")
      .wait(500)
      .waitAndTapByText("Month")
      .run();
  });

  it("Compact mode", async () => {
    await TestBuilder.create()
      .prepare()
      .createNote("Note 1", "Note 1")
      .waitAndTapById("icon-compact-mode")
      .isNotVisibleByText("Note 1")
      .waitAndTapById("icon-compact-mode")
      .isVisibleByText("Note 1")
      .run();
  });
});
