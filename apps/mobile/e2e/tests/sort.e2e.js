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
import { createNotebook } from "./notebook.e2e";
import {
  tapById,
  visibleByText,
  createNote,
  prepare,
  tapByText,
  notVisibleByText,
  sleep,
  navigate
} from "./utils";

async function sortBy(sorting, elementText = "Default") {
  await tapByText(elementText);
  await tapByText(sorting);
  await device.pressBack();
}

describe("Sort & filter", () => {
  it("Sort by date-edited/date-created", async () => {
    await prepare();
    let webview = web(by.id(notesnook.editor.id));
    await createNote("Note 1", "Note 1");
    await createNote("Note 2", "Note 2");
    await sleep(300);
    await tapByText("Note 1");
    await sleep(500);
    await expect(webview.element(by.web.className("ProseMirror"))).toExist();
    await webview.element(by.web.className("ProseMirror")).tap();
    await webview
      .element(by.web.className("ProseMirror"))
      .typeText("Edited ", true);
    await device.pressBack();
    await device.pressBack();
    await sortBy("Date created");
    await tapById(notesnook.listitem.menu);
    //await visibleByText("Note 2");
    await device.pressBack();
    await sortBy("Date edited");
    await tapById(notesnook.listitem.menu);
    //await visibleByText("Edited Note 1");
    await device.pressBack();
  });

  it("Disable grouping", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await sortBy("None");
    await sleep(300);
    await visibleByText("None");
  });

  it("Group by Abc", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await sortBy("Abc");
    await visibleByText("N");
  });

  it("Group by Year", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await sortBy("Year");
    await sleep(300);
    await visibleByText("Year");
  });

  it("Group by Week", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await sortBy("Week");
    await sleep(300);
    await visibleByText("Week");
  });

  it("Group by Month", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await sortBy("Month");
    await sleep(300);
    await visibleByText("Month");
  });

  it("Sort notes in topic", async () => {
    await prepare();
    await navigate("Notebooks");
    await sleep(500);
    await createNotebook("Notebook 1", true, true);
    await sleep(500);
    await device.pressBack();
    await sleep(500);
    await tapByText("Topic");
    await createNote("A", "A letter");
    await sleep(500);
    await createNote("B", "B letter");
    await sortBy("Abc");
    await sleep(300);
    await visibleByText("N");
  });

  it("Compact mode", async () => {
    await prepare();
    await createNote("Note 1", "Note 1");
    await sleep(300);
    await tapById("icon-compact-mode");
    await sleep(300);
    await notVisibleByText("Note 1");
    await tapById("icon-compact-mode");
    await sleep(300);
    await visibleByText("Note 1");
  });
});
