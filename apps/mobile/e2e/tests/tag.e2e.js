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
  elementById,
  tapByText,
  notVisibleByText,
  sleep
} from "./utils";

describe("Tags", () => {
  it("Tag a note", async () => {
    await prepare();
    let note = await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText("Add tags");
    await elementById("tag-input").typeText("testtag");
    await tapByText('Add "#testtag"');
    await visibleByText("#testtag");
    await device.pressBack();
    await device.pressBack();
    await navigate("Tags");
    await tapByText("#testtag");
    await visibleByText(note.body);
  });

  it.only("Untag a note", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText("Add tags");
    await elementById("tag-input").typeText("testtag");
    await tapByText('Add "#testtag"');
    await visibleByText("#testtag");
    await tapByText("#testtag");
    await device.pressBack();
    await device.pressBack();
    await notVisibleByText("#testtag");
  });

  it("Creat shortcut of a tag", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText("Add tags");
    await elementById("tag-input").typeText("testtag");
    await tapByText('Add "#testtag"');
    await visibleByText("#testtag");
    await device.pressBack();
    await device.pressBack();
    await navigate("Tags");
    await sleep(500);
    await tapById(notesnook.ids.tag.menu);
    await sleep(500);
    await tapByText("Add Shortcut");
    let menu = elementById(notesnook.ids.default.header.buttons.left);
    await menu.tap();
    await visibleByText("#testtag");
  });

  it("Rename a tag", async () => {
    await prepare();
    await createNote();
    await tapById(notesnook.listitem.menu);
    await tapByText("Add tags");
    await elementById("tag-input").typeText("testtag");
    await tapByText('Add "#testtag"');
    await visibleByText("#testtag");
    await device.pressBack();
    await device.pressBack();
    await navigate("Tags");
    await tapById(notesnook.ids.tag.menu);
    await sleep(500);
    await tapByText("Rename tag");
    await sleep(500);
    await elementById("input-value").clearText();
    await elementById("input-value").typeText("testtag_edited");
    await tapByText("Save");
    await visibleByText("#testtag_edited");
  });
});
