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

describe("NOTE TESTS", () => {
  it("Create a note in editor", async () => {
    await Tests.prepare();
    await Tests.createNote();
  });

  it("Open and close a note", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.ids.note.get(0)).waitAndTap();
    await Tests.exitEditor();
  });

  it("Notes properties should show", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromText("Created at").isVisible();
  });

  it("Favorite and unfavorite a note", async () => {
    await Tests.prepare();
    let note = await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-favorite").waitAndTap();
    await Tests.fromId("icon-star").isVisible();
    await Tests.navigate("Favorites");
    await Tests.fromText(note.body).isVisible();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-favorite").waitAndTap();
    await Tests.fromText(note.body).isNotVisible();
    await Tests.navigate("Notes");
  });

  it("Pin a note to top", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-pin").waitAndTap();
    await Tests.fromText("PINNED").isVisible();
    await Tests.fromId("icon-pinned").isVisible();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-pin").waitAndTap();
    await Tests.fromText("icon-pinned").isNotVisible();
  });

  it("Pin a note in notifications", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-pin-to-notifications").waitAndTap();
    await Tests.fromText("Unpin from notifications").isVisible();
    await Tests.fromId("icon-pin-to-notifications").waitAndTap();
    await Tests.fromText("Pin to notifications").isVisible();
  });

  it("Copy note", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-copy").isVisible();
    await Tests.fromId("icon-copy").waitAndTap();
  });

  it("Assign colors to a note", async () => {
    await Tests.prepare();
    let note = await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromText("Add color").waitAndTap();
    await Tests.fromId("color-title-input").element.typeText("Test color");
    await Tests.fromText("Add color").waitAndTap();
    await Tests.fromId("icon-check").isVisible();
    await Tests.fromId("icon-color-#efefef").waitAndTap();
    await Tests.fromId("icon-check").isNotVisible();
    await Tests.fromId("icon-color-#efefef").waitAndTap();
    await device.pressBack();
    await Tests.navigate("Test color");
    await Tests.fromText(note.body).isVisible();
  });

  it.only("Delete & restore a note", async () => {
    await Tests.prepare();
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromId("icon-trash").waitAndTap();
    await Tests.navigate("Trash");
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.fromText("Restore").waitAndTap();
    await device.pressBack();
    await Tests.fromText(
      "Test note description that is very long and should not fit in text."
    ).isVisible();
  });
});
