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

import { createNoteModel } from "../models/note";
import { getId } from "../utils/id";
import { getContentFromData } from "../content-types";
import { NEWLINE_STRIP_REGEX, formatTitle } from "../utils/title-format";
import { clone } from "../utils/clone";
import { Tiptap } from "../content-types/tiptap";
import { EMPTY_CONTENT, isUnencryptedContent } from "./content";
import { CHECK_IDS, checkIsUserPremium } from "../common";
import { buildFromTemplate } from "../utils/templates";
import {
  Note,
  TrashOrItem,
  isTrashItem,
  isDeleted,
  BaseTrashItem
} from "../types";
import Database from "../api";
import { CachedCollection } from "../database/cached-collection";
import { ICollection } from "./collection";
import { NoteContent } from "./session-content";

type ExportOptions = {
  format: "html" | "md" | "txt" | "md-frontmatter";
  contentItem?: NoteContent<false>;
  rawContent?: string;
  disableTemplate?: boolean;
};

export class Notes implements ICollection {
  name = "notes";
  /**
   * @internal
   */
  collection: CachedCollection<"notes", TrashOrItem<Note>>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "notes",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
  }

  async add(
    item: Partial<Note & { content: NoteContent<false>; sessionId: string }>
  ): Promise<string> {
    if (item.remote)
      throw new Error("Please use db.notes.merge to merge remote notes.");

    const id = item.id || getId();
    const oldNote = this.collection.get(id);
    if (oldNote && isTrashItem(oldNote))
      throw new Error("Cannot modify trashed notes.");

    const note = {
      ...oldNote,
      ...item
    };

    if (oldNote) note.contentId = oldNote.contentId;

    if (!oldNote && !item.content && !item.contentId && !item.title)
      throw new Error("Note must have a title or content.");

    if (item.content && item.content.data && item.content.type) {
      const { type, data } = item.content;

      const content = getContentFromData(type, data);
      if (!content) throw new Error("Invalid content type.");

      note.contentId = await this.db.content.add({
        noteId: id,
        sessionId: note.sessionId,
        id: note.contentId,
        type,
        data,
        localOnly: !!note.localOnly
      });

      note.headline = note.locked ? "" : getNoteHeadline(content);
      if (oldNote) note.dateEdited = Date.now();
    }

    if (item.localOnly !== undefined) {
      await this.db.content.add({
        id: note.contentId,
        localOnly: !!item.localOnly
      });
    }

    const noteTitle = this.getNoteTitle(note, oldNote, note.headline);
    if (oldNote && oldNote.title !== noteTitle) note.dateEdited = Date.now();

    await this.collection.add({
      id,
      contentId: note.contentId,
      type: "note",

      title: noteTitle,
      headline: note.headline,

      notebooks: note.notebooks || undefined,

      pinned: !!note.pinned,
      locked: !!note.locked,
      favorite: !!note.favorite,
      localOnly: !!note.localOnly,
      conflicted: !!note.conflicted,
      readonly: !!note.readonly,

      dateCreated: note.dateCreated || Date.now(),
      dateEdited:
        item.dateEdited || note.dateEdited || note.dateCreated || Date.now(),
      dateModified: note.dateModified || Date.now()
    });

    return id;
  }

  note(idOrNote: string | Note) {
    if (!idOrNote) return;
    const note =
      typeof idOrNote === "object" ? idOrNote : this.collection.get(idOrNote);
    if (!note || isTrashItem(note)) return;
    return createNoteModel(note, this.db);
  }

  get raw() {
    return this.collection.raw();
  }

  get all() {
    return this.collection.items((note) =>
      isTrashItem(note) ? undefined : note
    ) as Note[];
  }

  isTrashed(id: string) {
    return this.raw.find((item) => item.id === id && isTrashItem(item));
  }

  get trashed() {
    return this.raw.filter((item) =>
      isTrashItem(item)
    ) as BaseTrashItem<Note>[];
  }

  get pinned() {
    return this.all.filter((item) => item.pinned === true);
  }

  get conflicted() {
    return this.all.filter((item) => item.conflicted === true);
  }

  get favorites() {
    return this.all.filter((item) => item.favorite === true);
  }

  get locked(): Note[] {
    return this.all.filter(
      (item) => !isTrashItem(item) && item.locked === true
    ) as Note[];
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  delete(...ids: string[]) {
    return this._delete(true, ...ids);
  }

  remove(...ids: string[]) {
    return this._delete(false, ...ids);
  }

  async export(id: string, options: ExportOptions) {
    const { format, rawContent } = options;
    if (format !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
      return false;

    const note = this.note(id);
    if (!note) return false;

    if (!options.contentItem) {
      const rawContent = note.contentId
        ? await this.db.content.raw(note.contentId)
        : undefined;
      if (
        rawContent &&
        (isDeleted(rawContent) || !isUnencryptedContent(rawContent))
      )
        return false;
      options.contentItem = rawContent || EMPTY_CONTENT(note.id);
    }

    const { data, type } =
      format === "txt"
        ? options.contentItem
        : await this.db.content.downloadMedia(
            `export-${note.id}`,
            options.contentItem,
            false
          );

    const content = getContentFromData(type, data);

    const contentString =
      rawContent ||
      (format === "html"
        ? content.toHTML()
        : format === "md"
        ? content.toMD()
        : content.toTXT());

    return options?.disableTemplate
      ? contentString
      : buildFromTemplate(format, {
          ...note.data,
          content: contentString
        });
  }

  async duplicate(...ids: string[]) {
    for (const id of ids) {
      const note = this.collection.get(id);
      if (!note || isTrashItem(note)) continue;

      const content = note.contentId
        ? await this.db.content.raw(note.contentId)
        : undefined;
      if (content && (isDeleted(content) || !isUnencryptedContent(content)))
        throw new Error("Cannot duplicate a locked or deleted note.");
      const duplicateId = await this.db.notes.add({
        ...clone(note),
        id: undefined,
        content: content
          ? {
              type: content.type,
              data: content.data
            }
          : undefined,
        readonly: false,
        favorite: false,
        pinned: false,
        contentId: undefined,
        title: note.title + " (Copy)",
        dateEdited: undefined,
        dateCreated: undefined,
        dateModified: undefined
      });
      if (!duplicateId) return;

      for (const notebook of this.db.relations
        .to(note, "notebook")
        .resolved()) {
        await this.db.relations.add(notebook, {
          id: duplicateId,
          type: "note"
        });
      }

      return duplicateId;
    }
  }

  private async _delete(moveToTrash = true, ...ids: string[]) {
    for (const id of ids) {
      const item = this.collection.get(id);
      if (!item) continue;
      const itemData = clone(item);

      if (moveToTrash && !isTrashItem(itemData))
        await this.db.trash.add(itemData);
      else {
        await this.db.relations.unlinkAll(item, "tag");
        await this.db.relations.unlinkAll(item, "color");
        await this.db.relations.unlinkAll(item, "attachment");
        await this.db.relations.unlinkAll(item, "notebook");

        await this.collection.remove(id);
        if (itemData.contentId)
          await this.db.content.remove(itemData.contentId);
      }
    }
  }

  async addToNotebook(notebookId: string, ...noteIds: string[]) {
    for (const noteId of noteIds) {
      await this.db.relations.add(
        { id: notebookId, type: "notebook" },
        { type: "note", id: noteId }
      );
    }
  }

  async removeFromNotebook(notebookId: string, ...noteIds: string[]) {
    for (const noteId of noteIds) {
      await this.db.relations.unlink(
        { id: notebookId, type: "notebook" },
        { type: "note", id: noteId }
      );
    }
  }

  async removeFromAllNotebooks(...noteIds: string[]) {
    for (const noteId of noteIds) {
      await this.db.relations.unlinkAll(
        { type: "note", id: noteId },
        "notebook"
      );
    }
  }

  private getNoteTitle(note: Partial<Note>, oldNote?: Note, headline?: string) {
    if (note.title && note.title.trim().length > 0) {
      return note.title.replace(NEWLINE_STRIP_REGEX, " ");
    } else if (
      oldNote &&
      oldNote.title &&
      oldNote.title.trim().length > 0 &&
      (note.title === undefined || note.title === null)
    ) {
      return oldNote.title.replace(NEWLINE_STRIP_REGEX, " ");
    }

    return formatTitle(
      this.db.settings.getTitleFormat(),
      this.db.settings.getDateFormat(),
      this.db.settings.getTimeFormat(),
      headline?.split(" ").splice(0, 10).join(" "),
      this.collection.count()
    );
  }
}

function getNoteHeadline(content: Tiptap) {
  return content.toHeadline();
}
