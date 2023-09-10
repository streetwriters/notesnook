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

import Collection from "./collection";
import Note from "../models/note";
import { getId } from "../utils/id";
import { getContentFromData } from "../content-types";
import qclone from "qclone";
import { deleteItem, findById } from "../utils/array";
import { NEWLINE_STRIP_REGEX, formatTitle } from "../utils/title-format";

/**
 * @typedef {{ id: string, topic?: string, rebuildCache?: boolean }} NotebookReference
 */

export default class Notes extends Collection {
  constructor(db, name, cached) {
    super(db, name, cached);
    this.topicReferences = new NoteIdCache(this);
  }

  async init() {
    await super.init();
    this.topicReferences.rebuild();
  }

  trashed(id) {
    return this.raw.find((item) => item.dateDeleted > 0 && item.id === id);
  }

  async merge(localNote, remoteNote) {
    const id = remoteNote.id;

    if (localNote) {
      if (localNote.localOnly) return;

      if (localNote.color) await this._db.colors.untag(localNote.color, id);

      for (let tag of localNote.tags || []) {
        await this._db.tags.untag(tag, id);
      }
    }

    await this._resolveColorAndTags(remoteNote);

    return remoteNote;
  }

  async add(noteArg) {
    if (!noteArg) return;
    if (noteArg.remote)
      throw new Error("Please use db.notes.merge to merge remote notes.");

    let id = noteArg.id || getId();
    let oldNote = this._collection.getItem(id);

    let note = {
      ...oldNote,
      ...noteArg
    };

    if (oldNote) note.contentId = oldNote.contentId;

    if (!oldNote && !noteArg.content && !noteArg.contentId && !noteArg.title)
      return;

    if (noteArg.content && noteArg.content.data && noteArg.content.type) {
      const { type, data } = noteArg.content;

      let content = getContentFromData(type, data);
      if (!content) throw new Error("Invalid content type.");

      note.contentId = await this._db.content.add({
        noteId: id,
        sessionId: note.sessionId,
        id: note.contentId,
        type,
        data,
        localOnly: !!note.localOnly
      });

      note.headline = getNoteHeadline(note, content);
      if (oldNote) note.dateEdited = Date.now();
    }

    if (note.contentId && noteArg.localOnly !== undefined) {
      await this._db.content.add({
        id: note.contentId,
        localOnly: !!noteArg.localOnly
      });
    }

    const noteTitle = this._getNoteTitle(note, oldNote, note.headline);
    if (oldNote && oldNote.title !== noteTitle) note.dateEdited = Date.now();

    note = {
      id,
      contentId: note.contentId,
      type: "note",

      title: noteTitle,
      headline: note.headline,

      tags: note.tags || [],
      notebooks: note.notebooks || undefined,
      color: note.color,

      pinned: !!note.pinned,
      locked: !!note.locked,
      favorite: !!note.favorite,
      localOnly: !!note.localOnly,
      conflicted: !!note.conflicted,
      readonly: !!note.readonly,

      dateCreated: note.dateCreated,
      dateEdited: note.dateEdited || note.dateCreated || Date.now(),
      dateModified: note.dateModified
    };

    await this._collection.addItem(note);

    await this._resolveColorAndTags(note);
    return note.id;
  }

  /**
   *
   * @param {string} id The id of note
   * @returns {Note} The note of the given id
   */
  note(id) {
    if (!id) return;
    let note = id.type ? id : this._collection.getItem(id);
    if (!note || note.deleted) return;
    return new Note(note, this._db);
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @returns {any[]}
   */
  get all() {
    const items = this._collection.getItems();
    return items;
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

  get deleted() {
    return this.raw.filter((item) => item.dateDeleted > 0);
  }

  get locked() {
    return this.all.filter((item) => item.locked === true);
  }

  tagged(tagId) {
    return this._getTagItems(tagId, "tags");
  }

  colored(colorId) {
    return this._getTagItems(colorId, "colors");
  }

  exists(id) {
    return this._collection.exists(id);
  }

  /**
   * @private
   */
  _getTagItems(tagId, collection) {
    const tag = this._db[collection].tag(tagId);
    if (!tag || tag.noteIds.length <= 0) return [];
    const array = tag.noteIds.reduce((arr, id) => {
      const item = this.note(id);
      if (item) arr.push(item.data);
      return arr;
    }, []);
    return array.sort((a, b) => b.dateCreated - a.dateCreated);
  }

  delete(...ids) {
    return this._delete(true, ...ids);
  }

  remove(...ids) {
    return this._delete(false, ...ids);
  }

  /**
   * @private
   */
  async _delete(moveToTrash = true, ...ids) {
    for (let id of ids) {
      let item = this.note(id);
      if (!item) continue;
      const itemData = qclone(item.data);

      if (itemData.notebooks && !moveToTrash) {
        for (let notebook of itemData.notebooks) {
          for (let topicId of notebook.topics) {
            await this.removeFromNotebook(
              { id: notebook.id, topic: topicId, rebuildCache: false },
              id
            );
          }
        }
      }

      for (let tag of itemData.tags) {
        await this._db.tags.untag(tag, id);
      }

      if (itemData.color) {
        await this._db.colors.untag(itemData.color, id);
      }

      const attachments = this._db.attachments.ofNote(itemData.id, "all");
      for (let attachment of attachments) {
        await this._db.attachments.delete(
          attachment.metadata.hash,
          itemData.id
        );
      }

      // await this._collection.removeItem(id);
      if (moveToTrash) await this._db.trash.add(itemData);
      else {
        await this._collection.removeItem(id);
        await this._db.content.remove(itemData.contentId);
      }
    }
    this.topicReferences.rebuild();
  }

  async _resolveColorAndTags(note) {
    const { color, tags, id } = note;

    if (color) {
      const addedColor = await this._db.colors.add(color, id);
      if (addedColor) note.color = addedColor.title;
    }

    if (tags && tags.length) {
      for (let i = 0; i < tags.length; ++i) {
        const tag = tags[i];
        const addedTag = await this._db.tags.add(tag, id).catch(() => void 0);
        if (!addedTag) {
          tags.splice(i, 1);
          continue;
        }
        if (addedTag.title !== tag) tags[i] = addedTag.title;
      }
    }
  }

  /**
   * @param {NotebookReference} to
   */
  async addToNotebook(to, ...noteIds) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId } = to;

    for (let noteId of noteIds) {
      let note = this._db.notes.note(noteId);
      if (!note || note.data.deleted) continue;

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
          await this._db.notes.add({
            id: noteId,
            notebooks
          });
          this.topicReferences.add(topicId, noteId);
        }
      } else {
        await this._db.relations.add(
          { id: notebookId, type: "notebook" },
          note.data
        );
      }
    }
  }

  /**
   * @param {NotebookReference} to
   */
  async removeFromNotebook(to, ...noteIds) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId, rebuildCache = true } = to;

    for (const noteId of noteIds) {
      const note = this.note(noteId);
      if (!note || note.deleted) {
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

        await this._db.notes.add({
          id: noteId,
          notebooks
        });
      } else {
        await this._db.relations.unlink(
          { id: notebookId, type: "notebook" },
          note.data
        );
      }
    }
    if (rebuildCache) this.topicReferences.rebuild();
  }

  async removeFromAllNotebooks(...noteIds) {
    for (const noteId of noteIds) {
      const note = this.note(noteId);
      if (!note || note.deleted) {
        continue;
      }

      await this._db.notes.add({
        id: noteId,
        notebooks: []
      });
      await this._db.relations.unlinkAll(note.data, "notebook");
    }
    this.topicReferences.rebuild();
  }

  async _clearAllNotebookReferences(notebookId) {
    const notes = this._db.notes.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

      for (let notebook of notebooks) {
        if (notebook.id !== notebookId) continue;
        if (!deleteItem(notebooks, notebook)) continue;
      }

      await this._collection.updateItem(note);
    }
  }

  _getNoteTitle(note, oldNote, headline) {
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
      this._db.settings.getTitleFormat(),
      this._db.settings.getDateFormat(),
      this._db.settings.getTimeFormat(),
      headline?.split(" ").splice(0, 10).join(" "),
      this._collection.count()
    );
  }
}

function getNoteHeadline(note, content) {
  if (note.locked) return "";
  return content.toHeadline();
}

class NoteIdCache {
  /**
   *
   * @param {Notes} notes
   */
  constructor(notes) {
    this.notes = notes;
    this.cache = new Map();
  }

  rebuild() {
    this.cache = new Map();
    const notes = this.notes.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

      for (let notebook of notebooks) {
        for (let topic of notebook.topics) {
          this.add(topic, note.id);
        }
      }
    }
  }

  add(topicId, noteId) {
    let noteIds = this.cache.get(topicId);
    if (!noteIds) noteIds = [];
    if (noteIds.includes(noteId)) return;
    noteIds.push(noteId);
    this.cache.set(topicId, noteIds);
  }

  has(topicId, noteId) {
    let noteIds = this.cache.get(topicId);
    if (!noteIds) return false;
    return noteIds.includes(noteId);
  }

  count(topicId) {
    let noteIds = this.cache.get(topicId);
    if (!noteIds) return 0;
    return noteIds.length;
  }

  get(topicId) {
    return this.cache.get(topicId) || [];
  }
}
