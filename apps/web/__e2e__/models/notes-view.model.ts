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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";
import { BaseViewModel } from "./base-view.model";
import { EditorModel } from "./editor.model";
import { NoteItemModel } from "./note-item.model";

type Note = {
  title: string;
  content: string;
};

export class NotesViewModel extends BaseViewModel {
  private readonly createButton: Locator;
  readonly editor: EditorModel;

  constructor(
    page: Page,
    pageId: "home" | "notes" | "favorites" | "notebook",
    listType: string
  ) {
    super(page, pageId, listType);
    this.createButton = page.locator(
      // TODO:
      getTestId(`notes-action-button`)
    );
    this.editor = new EditorModel(page);
  }

  async newNote() {
    await this.createButton.first().click();
    await this.editor.waitForUnloading();
  }

  async createNote(note: Partial<Note>) {
    await this.newNote();
    if (note.title) await this.editor.setTitle(note.title);
    if (note.content) await this.editor.setContent(note.content);

    await this.editor.waitForSaving();
    if (note.title) await this.waitForItem(note.title);
    return await this.findNote(note);
  }

  async findNote(note: Partial<Note>) {
    for await (const item of this.iterateItems()) {
      const noteModel = new NoteItemModel(item);
      if ((await noteModel.getTitle()) === note.title) return noteModel;
    }
    return undefined;
  }
}
