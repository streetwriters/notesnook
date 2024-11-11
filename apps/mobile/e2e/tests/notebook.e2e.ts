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

describe("NOTEBOOKS", () => {
  it("Create a notebook with title only", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", false);
    await device.pressBack();
    await Tests.fromText("Notebook 1").isVisible();
  });

  it("Create a notebook title & description", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").isVisible();
  });

  it("Create a notebook, move notes", async () => {
    await Tests.prepare();
    let note = await Tests.createNote();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await Tests.fromId("listitem.select").waitAndTap();
    await Tests.fromText("Move selected notes").waitAndTap();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.fromText(note.body).isVisible();
  });

  it("Add a sub notebook to a notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.sleep(500);
    await Tests.fromId("add-notebook-button").waitAndTap();
    await Tests.createNotebook("Sub notebook", true);
    await Tests.fromText("Sub notebook").isVisible();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Move to trash").waitAndTap();
    await Tests.fromText("Delete").waitAndTap();
    await Tests.fromText("Sub notebook").isNotVisible();
  });

  it("Remove a sub notebook from notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.sleep(500);
    await Tests.fromId("add-notebook-button").waitAndTap();
    await Tests.createNotebook("Sub notebook", true);
    await Tests.fromText("Sub notebook").isVisible();
  });

  it("Edit notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromId(notesnook.buttons.add).waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.fromText("Edit notebook").waitAndTap();
    await Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.title
    ).element.typeText(" (edited)");
    await Tests.fromText("Save").waitAndTap();
    await Tests.fromText("Notebook 1 (edited)").isVisible();
  });

  it("Edit a sub notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromId(notesnook.buttons.add).waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.sleep(500);
    await Tests.fromId("add-notebook-button").waitAndTap();
    await Tests.createNotebook("Sub notebook", true);
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Edit notebook").waitAndTap();
    await Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.title
    ).element.typeText(" (edited)");
    await Tests.fromText("Save").waitAndTap();
    await Tests.fromText("Sub notebook (edited)").isVisible();
  });

  it("Add a note to notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.createNote();
  });

  it.skip("Remove note from Notebook", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.sleep(500);
    let note = await Tests.createNote();
    await Tests.fromText(note.body).element.longPress();
    await Tests.fromId("select-minus").waitAndTap();
    await Tests.fromId(note.title).isNotVisible();
  });

  it("Add/Remove note to notebook from home", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", true);
    await device.pressBack();
    await Tests.navigate("Notes");
    await Tests.createNote();
    await Tests.fromId(notesnook.listitem.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromId("icon-notebooks").waitAndTap();
    await Tests.fromText("Notebook 1").waitAndTap();
    await Tests.fromText("Save").waitAndTap();
    await Tests.fromText("Notebook 1").isVisible();
  });

  it("Edit notebook title, description", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook();
    await device.pressBack();
    await Tests.fromText("Notebook 1").isVisible();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Edit notebook").waitAndTap();
    await Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.title
    ).element.typeText(" (Edited)");
    await Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.description
    ).element.clearText();
    await Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.description
    ).element.typeText("Description of Notebook 1 (Edited)");
    await Tests.fromText("Save").waitAndTap();
    await Tests.fromText("Notebook 1 (Edited)").isVisible();
    await Tests.fromText("Description of Notebook 1 (Edited)").isVisible();
  });

  it.skip("Move notebook to trash", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", false);
    await device.pressBack();
    await Tests.fromText("Notebook 1").isVisible();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Move to trash").waitAndTap();
    await Tests.fromText("Delete").waitAndTap();
    await Tests.navigate("Trash");
    await Tests.fromText("Notebook 1").isVisible();
  });

  it("Move notebook to trash with notes", async () => {
    await Tests.prepare();
    let note = await Tests.createNote();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", false);
    await Tests.fromId("listitem.select").waitAndTap();
    await Tests.fromText("Move selected notes").waitAndTap();
    await Tests.fromText("Notebook 1").isVisible();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Move to trash").waitAndTap();
    await Tests.fromText(
      "Move all notes in this notebook to trash"
    ).waitAndTap();
    await Tests.fromText("Delete").waitAndTap();
    await Tests.navigate("Trash");
    await Tests.fromText("Notebook 1").isVisible();
    await Tests.fromText(note.body).isVisible();
  });

  it.skip("Pin notebook to side menu", async () => {
    await Tests.prepare();
    await Tests.navigate("Notebooks");
    await Tests.fromText("Add your first notebook").waitAndTap();
    await Tests.createNotebook("Notebook 1", false);
    await device.pressBack();
    await Tests.fromText("Notebook 1").isVisible();
    await Tests.fromId(notesnook.ids.notebook.menu).waitAndTap();
    await Tests.sleep(500);
    await Tests.fromText("Add Shortcut").waitAndTap();
    await Tests.fromId(notesnook.ids.default.header.buttons.left).waitAndTap();
    await Tests.fromText("Notebook 1").isVisible();
  });
});
