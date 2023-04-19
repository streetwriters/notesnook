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

export default class Note {
  /**
   *
   * @param {import('../api').default} db
   * @param {Object} note
   */
  constructor(note, db) {
    this._note = note;
    this._db = db;
  }

  get data() {
    return this._note;
  }

  get headline() {
    return this._note.headline;
  }

  get title() {
    return this._note.title;
  }

  get tags() {
    return this._note.tags;
  }

  get colors() {
    return this._note.colors;
  }

  get id() {
    return this._note.id;
  }

  get notebooks() {
    return this._note.notebooks;
  }

  get deleted() {
    return this._note.deleted;
  }

  get dateEdited() {
    return this._note.dateEdited;
  }

  get dateModified() {
    return this._note.dateModified;
  }

  get expiryDate() {
    return this._note.expiryDate;
  }

  /**
   *
   * @param {"html"|"md"|"txt"} format - Format to export into
   * @param {string} [contentItem=undefined]
   * @param {boolean} [template=true]
   * @param {string} [rawHTML=undefined] rawHTML - Use this raw content instead of generating itself
   * @returns {Promise<string | false | undefined>}
   */
  async export(to = "html", contentItem, template = true, rawHTML) {
    if (to !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
      return false;

    const templateData = {
      metadata: this.data,
      title: this.title,
      editedOn: formatDate(this.dateEdited),
      headline: this.headline,
      createdOn: formatDate(this.data.dateCreated),
      tags: this.tags.join(", ")
    };
    contentItem =
      contentItem || (await this._db.content.raw(this._note.contentId));
    if (!contentItem) return false;
    const { data, type } = await this._db.content.downloadMedia(
      `export-${this.id}`,
      contentItem,
      false
    );
    let content = getContentFromData(type, data);

    switch (to) {
      case "html":
        templateData.content = rawHTML || content.toHTML();
        return template
          ? HTMLBuilder.buildHTML(templateData)
          : templateData.content;
      case "txt":
        templateData.content = rawHTML || content.toTXT();
        return template
          ? TextBuilder.buildText(templateData)
          : templateData.content;
      case "md":
        templateData.content = rawHTML || content.toMD();
        return template
          ? MarkdownBuilder.buildMarkdown(templateData)
          : templateData.content;
      default:
        throw new Error("Export format not supported.");
    }
  }

  async content() {
    const content = await this._db.content.raw(this._note.contentId);
    return content ? content.data : null;
  }

  async duplicate() {
    const content = await this._db.content.raw(this._note.contentId);
    return await this._db.notes.add({
      ...this._note,
      id: undefined,
      content: {
        type: content.type,
        data: content.data
      },
      readonly: false,
      favorite: false,
      pinned: false,
      contentId: null,
      title: this._note.title + " (Copy)",
      dateEdited: null,
      dateCreated: null,
      dateModified: null,
      expiryDate: null
    });
  }

  async color(color) {
    if (!(await checkIsUserPremium(CHECK_IDS.noteColor))) return;
    if (this._note.color)
      await this._db.colors.untag(this._note.color, this._note.id);
    await this._db.notes.add({
      id: this.id,
      color: this._db.colors.sanitize(color)
    });
  }

  async uncolor() {
    if (!this._note.color) return;
    await this._db.colors.untag(this._note.color, this._note.id);
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

    let tagItem = await this._db.tags.add(tag, this._note.id);
    if (addItem(this._note.tags, tagItem.title))
      await this._db.notes.add(this._note);
  }

  async untag(tag) {
    if (deleteItem(this._note.tags, tag)) {
      await this._db.notes.add(this._note);
    } else console.error("This note is not tagged by the specified tag.", tag);
    await this._db.tags.untag(tag, this._note.id);
  }

  async setExpiryDate(expiryDate) {
    this._note.expiryDate = expiryDate;
  }

  _toggle(prop) {
    return this._db.notes.add({ id: this._note.id, [prop]: !this._note[prop] });
  }

  localOnly() {
    return this._toggle("localOnly");
  }

  favorite() {
    return this._toggle("favorite");
  }

  pin() {
    return this._toggle("pinned");
  }

  readonly() {
    return this._toggle("readonly");
  }

  synced() {
    return !this.data.contentId || this._db.content.exists(this.data.contentId);
  }
}
