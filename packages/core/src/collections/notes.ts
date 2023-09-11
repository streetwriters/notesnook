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
import { deleteItem, findById } from "../utils/array";
import { NEWLINE_STRIP_REGEX, formatTitle } from "../utils/title-format";
import { clone } from "../utils/clone";
import { Tiptap } from "../content-types/tiptap";
import { EMPTY_CONTENT, isUnencryptedContent } from "./content";
import { CHECK_IDS, checkIsUserPremium } from "../common";
import { buildFromTemplate } from "../utils/templates";
import { Note, TrashOrItem, isTrashItem, isDeleted } from "../types";
import Database from "../api";
import { CachedCollection } from "../database/cached-collection";
import { ICollection } from "./collection";
import { NoteContent } from "./session-content";

type NotebookReference = { id: string; topic?: string; rebuildCache?: boolean };
type ExportOptions = {
  format: "html" | "md" | "txt" | "md-frontmatter";
  contentItem?: NoteContent<false>;
  rawContent?: string;
  disableTemplate?: boolean;
};

export class Notes implements ICollection {
  name = "notes";
  topicReferences = new NoteIdCache(this);
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
    this.topicReferences.rebuild();
  }

  async add(
    item: Partial<Note & { content: NoteContent<false>; sessionId: string }>
  ): Promise<string | undefined> {
    if (!item) return;
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

    if (!oldNote && !item.content && !item.contentId && !item.title) return;

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
      dateEdited: note.dateEdited || note.dateCreated || Date.now(),
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
    return this.raw.filter((item) => isTrashItem(item)) as TrashOrItem<Note>[];
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

      if (itemData.notebooks && !moveToTrash) {
        for (const notebook of itemData.notebooks) {
          for (const topicId of notebook.topics) {
            await this.removeFromNotebook(
              { id: notebook.id, topic: topicId, rebuildCache: false },
              id
            );
          }
        }
      }

      await this.db.relations.unlinkAll(item, "tag");
      await this.db.relations.unlinkAll(item, "color");

      const attachments = this.db.attachments.ofNote(itemData.id, "all");
      for (const attachment of attachments) {
        await this.db.attachments.delete(attachment.metadata.hash, itemData.id);
      }

      if (moveToTrash && !isTrashItem(itemData))
        await this.db.trash.add(itemData);
      else {
        await this.collection.remove(id);
        if (itemData.contentId)
          await this.db.content.remove(itemData.contentId);
      }
    }
    this.topicReferences.rebuild();
  }

  async addToNotebook(to: NotebookReference, ...noteIds: string[]) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId } = to;

    for (const noteId of noteIds) {
      const note = this.collection.get(noteId);
      if (!note || isTrashItem(note)) continue;

      if (topicId) {
        const notebooks = note.notebooks || [];

        const noteNotebook = notebooks.find((nb) => nb.id === notebookId);
        const noteHasNotebook = !!noteNotebook;
        const noteHasTopic =
          noteHasNotebook && noteNotebook.topics.indexOf(topicId) > -1;
        if (noteHasNotebook && !noteHasTopic) {
          // 1 note can be inside multiple topics
          noteNotebook.topics.push(topicId);
        } else if (!noteHasNotebook) {
          notebooks.push({
            id: notebookId,
            topics: [topicId]
          });
        }

        if (!noteHasNotebook || !noteHasTopic) {
          await this.db.notes.add({
            id: noteId,
            notebooks
          });
          this.topicReferences.add(topicId, noteId);
        }
      } else {
        await this.db.relations.add({ id: notebookId, type: "notebook" }, note);
      }
    }
  }

  async removeFromNotebook(to: NotebookReference, ...noteIds: string[]) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId, rebuildCache = true } = to;

    for (const noteId of noteIds) {
      const note = this.collection.get(noteId);
      if (!note || isTrashItem(note)) {
        continue;
      }

      if (topicId) {
        if (!note.notebooks) continue;
        const { notebooks } = note;

        const notebook = findById(notebooks, notebookId);
        if (!notebook) continue;

        const { topics } = notebook;
        if (!deleteItem(topics, topicId)) continue;

        if (topics.length <= 0) deleteItem(notebooks, notebook);

        await this.db.notes.add({
          id: noteId,
          notebooks
        });
      } else {
        await this.db.relations.unlink(
          { id: notebookId, type: "notebook" },
          note
        );
      }
    }
    if (rebuildCache) this.topicReferences.rebuild();
  }

  async removeFromAllNotebooks(...noteIds: string[]) {
    for (const noteId of noteIds) {
      const note = this.collection.get(noteId);
      if (!note || isTrashItem(note)) {
        continue;
      }

      await this.db.notes.add({
        id: noteId,
        notebooks: []
      });
      await this.db.relations.unlinkAll(note, "notebook");
    }
    this.topicReferences.rebuild();
  }

  /**
   * @internal
   */
  async _clearAllNotebookReferences(notebookId: string) {
    const notes = this.db.notes.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

      for (const notebook of notebooks) {
        if (notebook.id !== notebookId) continue;
        if (!deleteItem(notebooks, notebook)) continue;
      }

      await this.collection.update(note);
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

class NoteIdCache {
  private cache = new Map<string, string[]>();
  constructor(private readonly notes: Notes) {}

  rebuild() {
    this.cache = new Map();
    const notes = this.notes.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) return;

      for (const notebook of notebooks) {
        for (const topic of notebook.topics) {
          this.add(topic, note.id);
        }
      }
    }
  }

  add(topicId: string, noteId: string) {
    let noteIds = this.cache.get(topicId);
    if (!noteIds) noteIds = [];
    if (noteIds.includes(noteId)) return;
    noteIds.push(noteId);
    this.cache.set(topicId, noteIds);
  }

  has(topicId: string, noteId: string) {
    const noteIds = this.cache.get(topicId);
    if (!noteIds) return false;
    return noteIds.includes(noteId);
  }

  count(topicId: string) {
    const noteIds = this.cache.get(topicId);
    if (!noteIds) return 0;
    return noteIds.length;
  }

  get(topicId: string) {
    return this.cache.get(topicId) || [];
  }
}
