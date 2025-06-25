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

describe("Tags", () => {
  it("Create a tag", async () => {
    await Tests.prepare();
    await Tests.openSideMenu();
    await Tests.fromId("tab-tags").waitAndTap();

    await Tests.fromText("No tags").isVisible();
    await Tests.fromId("sidebar-add-button").waitAndTap();

    await Tests.fromId("input-value").element.typeText("testtag");

    await Tests.fromText("Add").waitAndTap();
    await Tests.fromText("testtag").isVisible();
  });

  it("Tag a note", async () => {
    await Tests.prepare();
    let note = await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Add tag").waitAndTap();
    await Tests.fromId("tag-input").element.typeText("testtag");
    await Tests.fromText('Add "#testtag"').waitAndTap();
    await Tests.fromText("#testtag").isVisible();
    await device.pressBack();
    await device.pressBack();
    await Tests.openSideMenu();
    await Tests.fromId("tab-tags").waitAndTap();
    await Tests.fromText("#testtag").waitAndTap();
    await Tests.fromText(note.body).isVisible();
  });

  it("Untag a note", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Add tag").waitAndTap();
    await Tests.fromId("tag-input").element.typeText("testtag");
    await Tests.fromText('Add "#testtag"').waitAndTap();
    await Tests.fromText("#testtag").isVisible();
    await Tests.fromText("#testtag").waitAndTap();
    await device.pressBack();
    await device.pressBack();
    await Tests.fromText("#testtag").isNotVisible();
  });

  it("Create shortcut of a tag", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Add tag").waitAndTap();
    await Tests.fromId("tag-input").element.typeText("testtag");
    await Tests.fromText('Add "#testtag"').waitAndTap();
    await Tests.fromText("#testtag").isVisible();
    await device.pressBack();
    await device.pressBack();
    await Tests.openSideMenu();
    await Tests.fromId("tab-tags").waitAndTap();
    await Tests.fromText("testtag").element.longPress();
    await Tests.sleep(500);
    await Tests.fromText("Add shortcut").waitAndTap();
    await Tests.fromId("tab-home").waitAndTap();
    await Tests.fromText("testtag").isVisible();
  });

  it("Rename a tag", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Add tag").waitAndTap();
    await Tests.fromId("tag-input").element.typeText("testtag");
    await Tests.fromText('Add "#testtag"').waitAndTap();
    await Tests.fromText("#testtag").isVisible();
    await device.pressBack();
    await device.pressBack();
    await Tests.openSideMenu();
    await Tests.fromId("tab-tags").waitAndTap();
    await Tests.fromText("testtag").element.longPress();
    await Tests.sleep(500);
    await Tests.fromText("Rename").waitAndTap();
    await Tests.sleep(100);
    await Tests.fromId("input-value").element.clearText();
    await Tests.fromId("input-value").element.typeText("testtag_edited");
    await Tests.fromText("Save").waitAndTap();
    await Tests.fromText("testtag_edited").isVisible();
  });
});
