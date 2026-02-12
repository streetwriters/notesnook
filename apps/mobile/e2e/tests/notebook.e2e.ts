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

describe("NOTEBOOKS", () => {
  it("Create a notebook with title only", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", false)
      .wait(500)
      .isVisibleByText("Notebook 1")
      .run();
  });

  it("Create a notebook with title & description", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .isVisibleByText("Notebook 1")
      .run();
  });

  it("Add a sub notebook to a notebook", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapByText("Add notebook")
      .createNotebook("Sub notebook", true)
      .wait(500)
      .waitAndTapById("expand-notebook-0")
      .isVisibleByText("Sub notebook")
      .longPressByText("Sub notebook")
      .wait(500)
      .waitAndTapByText("Move to trash")
      .waitAndTapByText("Delete")
      .isNotVisibleByText("Sub notebook")
      .run();
  });

  it("Edit notebook", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapByText("Edit notebook")
      .typeTextById(notesnook.ids.dialogs.notebook.inputs.title, " (edited)")
      .waitAndTapByText("Save")
      .isVisibleByText("Notebook 1 (edited)")
      .run();
  });

  it("Edit a sub notebook", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapByText("Add notebook")
      .createNotebook("Sub notebook", true)
      .wait(500)
      .waitAndTapById("expand-notebook-0")
      .longPressByText("Sub notebook")
      .wait(500)
      .waitAndTapByText("Edit notebook")
      .typeTextById(notesnook.ids.dialogs.notebook.inputs.title, " (edited)")
      .waitAndTapByText("Save")
      .isVisibleByText("Sub notebook (edited)")
      .run();
  });

  it("Add a note to notebook", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .waitAndTapByText("Notebook 1")
      .createNote()
      .run();
  });

  it("Remove note from notebook", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .waitAndTapByText("Notebook 1")
      .wait(500)
      .createNote()
      .saveResult()
      .processResult(async (note) => {
        await TestBuilder.create()
          .longPressByText(note.body)
          .wait(500)
          .waitAndTapById("select-minus")
          .wait(500)
          .isNotVisibleByText(note.body)
          .run();
      })
      .run();
  });

  it("Add/Remove note to notebook from home", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", true)
      .wait(500)
      .waitAndTapById("tab-home")
      .waitAndTapByText("Notes")
      .createNote()
      .waitAndTapById(notesnook.listitem.menu)
      .wait(500)
      .waitAndTapById("icon-notebooks")
      .waitAndTapByText("Notebook 1")
      .waitAndTapById("floating-save-button")
      .isVisibleByText("Notebook 1")
      .run();
  });

  it("Edit notebook title and description", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook()
      .wait(500)
      .isVisibleByText("Notebook 1")
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapByText("Edit notebook")
      .typeTextById(notesnook.ids.dialogs.notebook.inputs.title, " (Edited)")
      .clearTextById(notesnook.ids.dialogs.notebook.inputs.description)
      .typeTextById(
        notesnook.ids.dialogs.notebook.inputs.description,
        "Description of Notebook 1 (Edited)"
      )
      .waitAndTapByText("Save")
      .isVisibleByText("Notebook 1 (Edited)")
      .run();
  });

  it("Move notebook to trash", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", false)
      .wait(500)
      .isVisibleByText("Notebook 1")
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapByText("Move to trash")
      .wait(500)
      .waitAndTapByText("Delete")
      .waitAndTapById("tab-home")
      .waitAndTapByText("Trash")
      .isVisibleByText("Notebook 1")
      .run();
  });

  it("Pin notebook to side menu", async () => {
    await TestBuilder.create()
      .prepare()
      .openSideMenu()
      .waitAndTapById("tab-notebooks")
      .waitAndTapById("sidebar-add-button")
      .createNotebook("Notebook 1", false)
      .wait(500)
      .isVisibleByText("Notebook 1")
      .longPressByText("Notebook 1")
      .wait(500)
      .waitAndTapById("icon-add-shortcut")
      .wait(500)
      .waitAndTapById("tab-home")
      .isVisibleByText("Notebook 1")
      .run();
  });
});
