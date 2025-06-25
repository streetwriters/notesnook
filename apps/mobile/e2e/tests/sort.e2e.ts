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
import { Tests } from "./utils";

async function sortBy(sorting: string) {
  await Tests.fromId("icon-sort").waitAndTap();
  await Tests.fromText(sorting).waitAndTap();
  await device.pressBack();
}

describe("Sort & filter", () => {
  it("Sort by date-edited/date-created", async () => {
    await Tests.prepare();
    let webview = web();
    await Tests.createNote("Note 1", "Note 1");
    await Tests.createNote("Note 2", "Note 2");
    await Tests.fromText("Note 1").waitAndTap();
    await webview.element(by.web.className("ProseMirror")).tap();
    await webview
      .element(by.web.className("ProseMirror"))
      .typeText("Edited ", true);
    await device.pressBack();
    await device.pressBack();
    await sortBy("Date created");
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await device.pressBack();
    await sortBy("Date edited");
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await device.pressBack();
  });

  it("Disable grouping", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await sortBy("None");
    await Tests.fromText("ALL").isVisible();
  });

  it("Group by Abc", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await sortBy("Abc");
    await Tests.fromText("N").isVisible();
  });

  it("Group by Year", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await sortBy("Year");
  });

  it("Group by Week", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await sortBy("Week");
  });

  it("Group by Month", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await sortBy("Month");
  });

  it("Compact mode", async () => {
    await Tests.prepare();
    await Tests.createNote("Note 1", "Note 1");
    await Tests.fromId("icon-compact-mode").waitAndTap();
    await Tests.fromText("Note 1").isNotVisible();
    await Tests.fromId("icon-compact-mode").waitAndTap();
    await Tests.fromText("Note 1").isVisible();
  });
});
