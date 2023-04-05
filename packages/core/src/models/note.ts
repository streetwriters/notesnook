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

import MarkdownBuilder from "../utils/templates/markdown/builder";
import HTMLBuilder from "../utils/templates/html/builder";
import TextBuilder from "../utils/templates/text/builder";
import { getContentFromData } from "../content-types";
import { CHECK_IDS, checkIsUserPremium } from "../common";
import { addItem, deleteItem } from "../utils/array";
import { formatDate } from "../utils/date";
import { Note, NotebookReference } from "../entities";

interface INoteModel extends Readonly<Note> {
  export(
    to?: "html" | "md" | "txt",
    rawContent?: string
  ): Promise<string | false | undefined>;

  readonly data: Note;
}

export class NoteModel implements INoteModel {
  constructor(private readonly note: Note) {}

  get title() {
    return this.note.title;
  }
  get notebooks() {
    return this.note.notebooks;
  }
  get tags() {
    return this.note.tags;
  }
  get dateEdited() {
    return this.note.dateEdited;
  }
  get pinned() {
    return this.note.pinned;
  }
  get locked() {
    return this.note.locked;
  }
  get favorite() {
    return this.note.favorite;
  }
  get localOnly() {
    return this.note.localOnly;
  }
  get conflicted() {
    return this.note.conflicted;
  }
  get readonly() {
    return this.note.readonly;
  }
  get contentId() {
    return this.note.contentId;
  }
  get sessionId() {
    return this.note.sessionId;
  }
  get headline() {
    return this.note.headline;
  }
  get color() {
    return this.note.color;
  }
  get id() {
    return this.note.id;
  }
  get type() {
    return this.note.type;
  }
  get dateModified() {
    return this.note.dateModified;
  }
  get dateCreated() {
    return this.note.dateCreated;
  }
  get migrated() {
    return this.note.migrated;
  }
  get remote() {
    return this.note.remote;
  }

  /**
   * @deprecated use the model directly
   */
  get data() {
    return this.note;
  }

  async export(to = "html", rawContent?: string) {
    if (to !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
      return false;
    const templateData = {
      metadata: this,
      title: this.title,
      editedOn: formatDate(this.dateEdited),
      headline: this.headline,
      createdOn: formatDate(this.dateCreated),
      tags: this.tags.join(", ")
    };
    const contentItem = await this._db.content.raw(this.contentId);
    if (!contentItem) return false;
    const { data, type } = await this._db.content.downloadMedia(
      `export-${this.id}`,
      contentItem,
      false
    );
    const content = getContentFromData(type, data);
    switch (to) {
      case "html":
        templateData.content = rawContent || content.toHTML();
        return HTMLBuilder.buildHTML(templateData);
      case "txt":
        templateData.content = rawContent || content.toTXT();
        return TextBuilder.buildText(templateData);
      case "md":
        templateData.content = rawContent || content.toMD();
        return MarkdownBuilder.buildMarkdown(templateData);
      default:
        throw new Error("Export format not supported.");
    }
  }

  async content() {
    const content = await this._db.content.raw(this.contentId);
    return content ? content.data : null;
  }

  async duplicate() {
    const content = await this._db.content.raw(this.contentId);
    return await this._db.notes.add({
      ...this.note,
      id: undefined,
      content: {
        type: content.type,
        data: content.data
      },
      readonly: false,
      favorite: false,
      pinned: false,
      contentId: null,
      title: this.title + " (Copy)",
      dateEdited: null,
      dateCreated: null,
      dateModified: null
    });
  }

  async color(color: string) {
    if (!(await checkIsUserPremium(CHECK_IDS.noteColor))) return;
    if (this.color) await this._db.colors.untag(this.color, this.id);
    await this._db.notes.add({
      id: this.id,
      color: this._db.colors.sanitize(color)
    });
  }

  async uncolor() {
    if (!this.color) return;
    await this._db.colors.untag(this.color, this.id);
    await this._db.notes.add({
      id: this.id,
      color: undefined
    });
  }

  async tag(tag) {
    if (
      !this._db.tags.tag(tag) &&
      this._db.tags.all.length >= 5 &&
      !(await checkIsUserPremium(CHECK_IDS.noteTag))
    )
      return;
    let tagItem = await this._db.tags.add(tag, this.id);
    if (addItem(this.tags, tagItem.title)) await this._db.notes.add(this);
  }

  async untag(tag) {
    if (deleteItem(this.tags, tag)) {
      await this._db.notes.add(this);
    } else console.error("This note is not tagged by the specified tag.", tag);
    await this._db.tags.untag(tag, this.id);
  }

  localOnly() {
    return this.toggle("localOnly");
  }

  favorite() {
    return this.toggle("favorite");
  }

  pin() {
    return this.toggle("pinned");
  }

  readonly() {
    return this.toggle("readonly");
  }

  get synced() {
    return !this.contentId || this._db.content.exists(this.contentId);
  }

  private toggle(prop: "localOnly" | "readonly" | "pinned" | "favorite") {
    return this._db.notes.add({ id: this.id, [prop]: !this[prop] });
  }
}
