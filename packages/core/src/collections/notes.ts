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

import { getId } from "../utils/id.js";
import { getContentFromData } from "../content-types/index.js";
import { NEWLINE_STRIP_REGEX, formatTitle } from "../utils/title-format.js";
import { clone } from "../utils/clone.js";
import { Tiptap } from "../content-types/tiptap.js";
import { EMPTY_CONTENT } from "./content.js";
import { buildFromTemplate } from "../utils/templates/index.js";
import {
  Note,
  TrashOrItem,
  isTrashItem,
  isDeleted,
  NoteContent
} from "../types.js";
import Database from "../api/index.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";
import { logger } from "../logger.js";

export type ExportOptions = {
  format: "html" | "md" | "txt" | "md-frontmatter";
  contentItem?: NoteContent<false>;
  rawContent?: string;
  disableTemplate?: boolean;
  embedMedia?: boolean;
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
      db.eventManager,
      db.sanitizer
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
      let headline = item.headline;

      if (item.content && item.content.data && item.content.type) {
        logger.debug("saving content", { id });
        const { type, data } = item.content;

        const content = await getContentFromData(type, data);
        if (!content) throw new Error("Invalid content type.");

        headline = getNoteHeadline(content);
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

      if (typeof item.title !== "undefined") {
        item.title = item.title.replace(NEWLINE_STRIP_REGEX, " ");
        dateEdited = Date.now();
      }

      if (!isUpdating || item.title === "") {
        item.title =
          item.title ||
          formatTitle(
            this.db.settings.getTitleFormat(),
            this.db.settings.getDateFormat(),
            this.db.settings.getTimeFormat(),
            headline?.split(" ").splice(0, 10).join(" ") || "",
            this.totalNotes
          );
      }

      if (isUpdating) {
        await this.collection.update([id], {
          title: item.title,
          headline: headline,
          contentId,

          pinned: item.pinned,
          favorite: item.favorite,
          localOnly: item.localOnly,
          conflicted: item.conflicted,
          readonly: item.readonly,

          dateEdited: item.dateEdited || dateEdited
        });
      } else {
        await this.collection.upsert({
          id,
          type: "note",
          contentId,

          title: item.title,
          headline: headline,

          pinned: item.pinned,
          favorite: item.favorite,
          localOnly: item.localOnly,
          conflicted: item.conflicted,
          readonly: item.readonly,

          dateCreated: item.dateCreated || Date.now(),
          dateEdited: item.dateEdited || dateEdited || Date.now()
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

  async tags(id: string) {
    return this.db.relations
      .to({ id, type: "note" }, "tag")
      .selector.items(undefined, {
        sortBy: "dateCreated",
        sortDirection: "asc"
      });
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

  async export(id: string, options: ExportOptions): Promise<false | string>;
  async export(note: Note, options: ExportOptions): Promise<false | string>;
  async export(noteOrId: Note | string, options: ExportOptions) {
    const note =
      typeof noteOrId === "string" ? await this.note(noteOrId) : noteOrId;
    if (!note) return false;

    const { format, rawContent } = options;

    const contentString =
      rawContent ||
      (await (async () => {
        let contentItem = options.contentItem;
        if (!contentItem) {
          const rawContent = await this.db.content.findByNoteId(note.id);
          if (rawContent && rawContent.locked) return false;
          contentItem = rawContent || EMPTY_CONTENT(note.id);
        }

        const { data, type } =
          options?.embedMedia && format !== "txt"
            ? await this.db.content.downloadMedia(
                `export-${note.id}`,
                contentItem,
                false
              )
            : contentItem;
        const content = await getContentFromData(type, data);
        return format === "html"
          ? content.toHTML()
          : format === "md"
          ? content.toMD()
          : content.toTXT();
      })());
    if (!contentString) return false;

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
      const duplicateId = await this.db.notes.add({
        ...clone(note),
        id: undefined,
        readonly: false,
        favorite: false,
        pinned: false,
        contentId: undefined,
        title: note.title + " (Copy)",
        dateEdited: undefined,
        dateCreated: undefined,
        dateModified: undefined
      });

      const contentId = await this.db.content.add({
        ...clone(content),
        id: undefined,
        noteId: duplicateId,
        dateResolved: undefined,
        dateEdited: undefined,
        dateCreated: undefined,
        dateModified: undefined
      });

      await this.db.notes.add({ id: duplicateId, contentId });

      for (const relation of await this.db.relations.to(note).get()) {
        await this.db.relations.add(
          { type: relation.fromType, id: relation.fromId },
          {
            id: duplicateId,
            type: "note"
          }
        );
      }

      for (const relation of await this.db.relations.from(note).get()) {
        await this.db.relations.add(
          {
            id: duplicateId,
            type: "note"
          },
          { type: relation.toType, id: relation.toId }
        );
      }
    }
  }

  private async _delete(moveToTrash = true, ...ids: string[]) {
    if (ids.length <= 0) return;

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
    await this.db.relations
      .to({ type: "note", ids: noteIds }, "notebook")
      .unlink();
  }

  async contentBlocks(id: string) {
    const content = await this.db.content.findByNoteId(id);
    if (!content || content.locked) return [];

    return (await getContentFromData(content.type, content.data)).extract(
      "blocks"
    ).blocks;
  }

  async contentBlocksWithLinks(id: string) {
    const content = await this.db.content.findByNoteId(id);
    if (!content || content.locked) return [];

    return (await getContentFromData(content.type, content.data)).extract(
      "blocksWithLink"
    ).blocks;
  }

  async internalLinks(id: string) {
    const content = await this.db.content.findByNoteId(id);
    if (!content || content.locked) return [];

    return (await getContentFromData(content.type, content.data)).extract(
      "internalLinks"
    ).internalLinks;
  }
}

function getNoteHeadline(content: Tiptap) {
  return content.toHeadline();
}
