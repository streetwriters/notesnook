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

import { getId } from "../utils/id";
import { getContentFromData } from "../content-types";
import { NEWLINE_STRIP_REGEX, formatTitle } from "../utils/title-format";
import { clone } from "../utils/clone";
import { Tiptap } from "../content-types/tiptap";
import { EMPTY_CONTENT } from "./content";
import { CHECK_IDS, checkIsUserPremium } from "../common";
import { buildFromTemplate } from "../utils/templates";
import { Note, TrashOrItem, isTrashItem, isDeleted } from "../types";
import Database from "../api";
import { ICollection } from "./collection";
import { NoteContent } from "./session-content";
import { SQLCollection } from "../database/sql-collection";
import { isFalse } from "../database";

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
  collection: SQLCollection<"notes", TrashOrItem<Note>>;
  totalNotes = 0;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "notes",
      db.eventManager
    );
  }

  async init() {
    await this.collection.init();
    this.totalNotes = await this.collection.count();
  }

  async add(
    item: Partial<Note & { content: NoteContent<false>; sessionId: string }>
  ): Promise<string> {
    if (item.remote)
      throw new Error("Please use db.notes.merge to merge remote notes.");

    const id = item.id || getId();
    const isUpdating = item.id && (await this.exists(item.id));

    if (!isUpdating && !item.content && !item.contentId && !item.title)
      throw new Error("Note must have a title or content.");

    await this.db.transaction(async () => {
      let contentId = item.contentId;
      let dateEdited = item.dateEdited;
      let headline = "";

      if (item.content && item.content.data && item.content.type) {
        const { type, data } = item.content;

        const content = getContentFromData(type, data);
        if (!content) throw new Error("Invalid content type.");

        headline = item.locked ? "" : getNoteHeadline(content);
        dateEdited = Date.now();
        contentId = await this.db.content.add({
          noteId: id,
          sessionId: item.sessionId,
          id: contentId,
          dateEdited,
          type,
          data,
          ...(item.localOnly !== undefined ? { localOnly: item.localOnly } : {})
        });
      } else if (contentId && item.localOnly !== undefined) {
        await this.db.content.add({
          id: contentId,
          localOnly: !!item.localOnly
        });
      }

      if (item.title) {
        item.title = item.title.replace(NEWLINE_STRIP_REGEX, " ");
        dateEdited = Date.now();
      } else if (!isUpdating) {
        item.title = formatTitle(
          this.db.settings.getTitleFormat(),
          this.db.settings.getDateFormat(),
          this.db.settings.getTimeFormat(),
          headline.split(" ").splice(0, 10).join(" "),
          this.totalNotes
        );
      }

      if (isUpdating) {
        await this.collection.update([id], {
          title: item.title,
          headline,
          contentId,

          pinned: item.pinned,
          locked: item.locked,
          favorite: item.favorite,
          localOnly: item.localOnly,
          conflicted: item.conflicted,
          readonly: item.readonly,

          dateEdited
        });
      } else {
        await this.collection.upsert({
          id,
          type: "note",
          contentId,

          title: item.title,
          headline: headline,

          pinned: item.pinned,
          locked: item.locked,
          favorite: item.favorite,
          localOnly: item.localOnly,
          conflicted: item.conflicted,
          readonly: item.readonly,

          dateCreated: item.dateCreated || Date.now(),
          dateEdited: dateEdited || Date.now()
        });
        this.totalNotes++;
      }
    });
    return id;
  }

  async note(id: string) {
    const note = await this.collection.get(id);
    if (!note || isTrashItem(note) || isDeleted(note)) return;
    return note;
  }

  async trashed(id: string) {
    const note = await this.collection.get(id);
    if (note && (!isTrashItem(note) || isDeleted(note))) return;
    return note;
  }

  // note(idOrNote: string | Note) {
  //   if (!idOrNote) return;
  //   const note =
  //     typeof idOrNote === "object" ? idOrNote : this.collection.get(idOrNote);
  //   if (!note || isTrashItem(note)) return;
  //   return createNoteModel(note, this.db);
  // }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Note>(
      (qb) => qb.where(isFalse("dateDeleted")).where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  // isTrashed(id: string) {
  //   return this.raw.find((item) => item.id === id && isTrashItem(item));
  // }

  // get trashed() {
  //   return this.raw.filter((item) =>
  //     isTrashItem(item)
  //   ) as BaseTrashItem<Note>[];
  // }

  get pinned() {
    return this.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("pinned", "==", true),
      this.db.options?.batchSize
    );
  }

  get conflicted() {
    return this.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("conflicted", "==", true),
      this.db.options?.batchSize
    );
  }

  get favorites() {
    return this.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("favorite", "==", true),
      this.db.options?.batchSize
    );
  }

  get locked() {
    return this.collection.createFilter<Note>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("locked", "==", true),
      this.db.options?.batchSize
    );
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  moveToTrash(...ids: string[]) {
    return this._delete(true, ...ids);
  }

  remove(...ids: string[]) {
    return this._delete(false, ...ids);
  }

  pin(state: boolean, ...ids: string[]) {
    return this.collection.update(ids, { pinned: state });
  }
  favorite(state: boolean, ...ids: string[]) {
    return this.collection.update(ids, { favorite: state });
  }
  readonly(state: boolean, ...ids: string[]) {
    return this.collection.update(ids, { readonly: state });
  }
  async localOnly(state: boolean, ...ids: string[]) {
    await this.db.transaction(async () => {
      await this.collection.update(ids, { localOnly: state });
      await this.db.content.updateByNoteId({ localOnly: state }, ...ids);
    });
  }

  async export(id: string, options: ExportOptions) {
    const { format, rawContent } = options;
    if (format !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
      return false;

    const note = await this.note(id);
    if (!note) return false;

    if (!options.contentItem) {
      const rawContent = note.contentId
        ? await this.db.content.get(note.contentId)
        : undefined;
      if (rawContent && rawContent.locked) return false;
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

    const tags = (await this.db.relations.to(note, "tag").resolve()).map(
      (tag) => tag.title
    );
    const color = (await this.db.relations.to(note, "color").resolve(1)).at(
      0
    )?.title;

    return options?.disableTemplate
      ? contentString
      : buildFromTemplate(format, {
          ...note,
          tags,
          color,
          content: contentString
        });
  }

  async duplicate(...ids: string[]) {
    for (const id of ids) {
      const note = await this.note(id);
      if (!note) continue;

      const content = note.contentId
        ? await this.db.content.get(note.contentId)
        : undefined;
      if (content && (isDeleted(content) || content.locked))
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
      if (!duplicateId) continue;

      for (const relation of await this.db.relations
        .to(note, "notebook")
        .get()) {
        await this.db.relations.add(
          { type: "notebook", id: relation.fromId },
          {
            id: duplicateId,
            type: "note"
          }
        );
      }
    }
  }

  private async _delete(moveToTrash = true, ...ids: string[]) {
    if (moveToTrash) {
      await this.db.trash.add("note", ids);
    } else {
      await this.db.transaction(async () => {
        await this.db.relations.unlinkOfType("note", ids);
        await this.collection.softDelete(ids);
        await this.db.content.removeByNoteId(...ids);
      });
    }

    this.totalNotes = Math.max(0, this.totalNotes - ids.length);
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
    await this.db.transaction(async () => {
      for (const noteId of noteIds) {
        await this.db.relations.unlink(
          { id: notebookId, type: "notebook" },
          { type: "note", id: noteId }
        );
      }
    });
  }

  async removeFromAllNotebooks(...noteIds: string[]) {
    await this.db.transaction(async () => {
      for (const noteId of noteIds) {
        await this.db.relations
          .to({ type: "note", id: noteId }, "notebook")
          .unlink();
      }
    });
  }

  async getBlocks(id: string) {
    const note = await this.collection.get(id);
    if (note?.locked || !note?.contentId) return [];
    const rawContent = await this.db.content.get(note.contentId);
    if (!rawContent || rawContent.locked) return [];

    return getContentFromData(
      rawContent.type,
      rawContent?.data
    ).extractBlocks();
  }
}

function getNoteHeadline(content: Tiptap) {
  return content.toHeadline();
}
