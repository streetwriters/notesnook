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

import { ICollection } from "./collection";
// import Note from "../models/note";
import {
  MaybeDeletedItem,
  Note,
  TrashOrItem,
  isDeleted,
  isTrashItem
} from "../entities";
import getId from "../utils/id";
import { getContentFromData } from "../content-types";
import { deleteItem, findById } from "../utils/array";
import CachedCollection from "../database/cached-collection";
import { IStorage } from "../interfaces";
import { clone } from "../utils/clone";

type NotebookReference = {
  id: string;
  topic?: string;
  rebuildCache?: boolean;
};

export default class Notes implements ICollection<"notes", Note> {
  private readonly collection: CachedCollection<"notes", TrashOrItem<Note>>;
  private readonly topicReferences: NoteIdCache;
  constructor(storage: IStorage) {
    this.collection = new CachedCollection(storage, "notes");
    this.topicReferences = new NoteIdCache(this);
  }

  async init() {
    await this.collection.init();
    this.topicReferences.rebuild();
  }

  async merge(remoteNote: MaybeDeletedItem<TrashOrItem<Note>>) {
    if (!remoteNote) return;
    if (isDeleted(remoteNote))
      return await this.collection.removeItem(remoteNote.id);

    const id = remoteNote.id;
    const localNote = this.collection.getItem(id);
    if (localNote) {
      if (localNote.color) await this._db.colors.untag(localNote.color, id);

      for (const tag of localNote.tags || []) {
        await this._db.tags.untag(tag, id);
      }
    }

    if (isTrashItem(remoteNote))
      return await this.collection.addItem(remoteNote);

    await this.resolveColorAndTags(remoteNote);

    return await this.collection.addItem(remoteNote);
  }

  async add(noteArg: Partial<Note>) {
    if (noteArg.remote)
      throw new Error("Please use db.notes.merge to merge remote notes.");

    const id = noteArg.id || getId();
    const oldNote = this.collection.getItem(id);

    let note: Note = {
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

    if (noteArg.localOnly !== undefined) {
      await this._db.content.add({
        id: note.contentId,
        localOnly: !!noteArg.localOnly
      });
    }

    const noteTitle = getNoteTitle(note, oldNote);
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

    await this.collection.addItem(note);

    await this.resolveColorAndTags(note);
    return note.id;
  }

  note(id: string | TrashOrItem<Note>) {
    if (!id) return;
    const note = typeof id === "string" ? this.collection.getItem(id) : id;
    if (!note || isTrashItem(note)) return;
    return new Note(note, this._db);
  }

  get raw() {
    return this.collection.getRaw();
  }

  get all() {
    return this.collection.getItems();
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

  get trashed() {
    return this.all.filter((item) => isTrashItem(item));
  }

  get locked() {
    return this.all.filter((item) => item.locked === true);
  }

  isTrashed(id: string) {
    return this.all.find((item) => item.id === id && isTrashItem(item));
  }

  tagged(tagId: string) {
    return this.getTagItems(tagId, "tags");
  }

  colored(colorId: string) {
    return this.getTagItems(colorId, "colors");
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  private getTagItems(tagId: string, collection) {
    const tag = this._db[collection].tag(tagId);
    if (!tag || tag.noteIds.length <= 0) return [];
    const array = tag.noteIds.reduce((arr, id) => {
      const item = this.note(id);
      if (item) arr.push(item.data);
      return arr;
    }, []);
    return array.sort((a, b) => b.dateCreated - a.dateCreated);
  }

  delete(...ids: string[]) {
    return this.deleteOrRemove(true, ...ids);
  }

  remove(...ids: string[]) {
    return this.deleteOrRemove(false, ...ids);
  }

  private async deleteOrRemove(moveToTrash = true, ...ids: string[]) {
    for (const id of ids) {
      const item = this.note(id);
      if (!item) continue;
      const itemData = clone(item.data);

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

      for (const tag of itemData.tags) {
        await this._db.tags.untag(tag, id);
      }

      if (itemData.color) {
        await this._db.colors.untag(itemData.color, id);
      }

      const attachments = this._db.attachments.ofNote(itemData.id, "all");
      for (const attachment of attachments) {
        await this._db.attachments.delete(
          attachment.metadata.hash,
          itemData.id
        );
      }

      // await this.collection.removeItem(id);
      if (moveToTrash) await this._db.trash.add(itemData);
      else {
        await this.collection.removeItem(id);
        await this._db.content.remove(itemData.contentId);
      }
    }
    this.topicReferences.rebuild();
  }

  private async resolveColorAndTags(note: Note) {
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

  private async addToNotebook(to: NotebookReference, ...noteIds: string[]) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId } = to;

    for (const noteId of noteIds) {
      const note = this.note(noteId);
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
          await this.add({
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

  async removeFromNotebook(to: NotebookReference, ...noteIds: string[]) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id) throw new Error("The destination notebook must contain id.");

    const { id: notebookId, topic: topicId, rebuildCache = true } = to;

    for (const noteId of noteIds) {
      const note = this.note(noteId);
      if (!note || note.deleted || !note.notebooks) {
        continue;
      }

      if (topicId) {
        const { notebooks } = note;

        const notebook = findById(notebooks, notebookId);
        if (!notebook) continue;

        const { topics } = notebook;
        if (!deleteItem(topics, topicId)) continue;

        if (topics.length <= 0) deleteItem(notebooks, notebook);

        await this.add({
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

  async removeFromAllNotebooks(...noteIds: string[]) {
    for (const noteId of noteIds) {
      const note = this.note(noteId);
      if (!note || note.deleted) {
        continue;
      }

      await this.add({
        id: noteId,
        notebooks: []
      });
      await this._db.relations.unlinkAll(note.data, "notebook");
    }
    this.topicReferences.rebuild();
  }

  async _clearAllNotebookReferences(notebookId: string) {
    const notes = this.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

      for (const notebook of notebooks) {
        if (notebook.id !== notebookId) continue;
        if (!deleteItem(notebooks, notebook)) continue;
      }

      await this.collection.updateItem(note);
    }
  }
}

function getNoteHeadline(note: Note, content) {
  if (note.locked) return "";
  return content.toHeadline();
}

const NEWLINE_STRIP_REGEX = /[\r\n\t\v]+/gm;
function getNoteTitle(note: Note, oldNote?: Note) {
  if (note.title && note.title.trim().length > 0) {
    return note.title.replace(NEWLINE_STRIP_REGEX, " ");
  } else if (oldNote && oldNote.title && oldNote.title.trim().length > 0) {
    return oldNote.title.replace(NEWLINE_STRIP_REGEX, " ");
  }

  return `Note ${new Date().toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short"
  })}`;
}

class NoteIdCache {
  private cache: Map<string, string[]>;
  constructor(private readonly notes: Notes) {
    this.cache = new Map();
  }

  rebuild() {
    this.cache = new Map<string, string[]>();
    const notes = this.notes.all;

    for (const note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

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
