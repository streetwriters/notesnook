import Collection from "./collection";
import Note from "../models/note";
import getId from "../utils/id";
import { EV, EVENTS } from "../common";
import { getContentFromData } from "../content-types";
import qclone from "qclone/src/qclone";
import sort from "fast-sort";
import { deleteItem } from "../utils/array";

export default class Notes extends Collection {
  async add(noteArg) {
    if (!noteArg) return;
    if (noteArg.deleted) {
      await this._collection.addItem(noteArg);
      return;
    }

    let id = noteArg.id || getId();
    let oldNote = this._collection.getItem(id);

    if (noteArg.remote || noteArg.migrated) {
      const { color, tags, notebooks } = noteArg;

      if (oldNote) {
        if (!!oldNote.color && oldNote.color !== color) {
          await this._db.colors.remove(oldNote.color, id);
        }
        if (!!oldNote.tags) {
          for (let tag of oldNote.tags) {
            await this._db.tags.untag(tag, id);
          }
        }
      }

      if (color) {
        await this._db.colors.add(color, id);
      }

      if (tags && tags.length) {
        for (let tag of tags) {
          await this._db.tags.add(tag, id);
        }
      }

      return await this._collection.addItem(noteArg);
    }

    let note = {
      ...oldNote,
      ...noteArg,
    };

    if (oldNote) note.contentId = oldNote.contentId;

    if (!oldNote && !noteArg.content && !noteArg.contentId) return;

    if (noteArg.content && noteArg.content.data && noteArg.content.type) {
      const { type, data, conflicted, resolved } = noteArg.content;

      let content = getContentFromData(type, data);
      if (!content) throw new Error("Invalid content type.");
      note.title = getNoteTitle(note, content);
      note.headline = getNoteHeadline(note, content);

      if (isNoteEmpty(note, content)) {
        if (oldNote) {
          EV.publish(EVENTS.noteRemoved, id);
          await this.remove(id);
        }
        return;
      }

      note.contentId = await this._db.content.add({
        noteId: id,
        id: note.contentId,
        type,
        data,
        conflicted,
        resolved,
        localOnly: !!note.localOnly,
      });
    }

    note = {
      id,
      contentId: note.contentId,
      type: "note",
      title: note.title,
      headline: note.headline,
      pinned: !!note.pinned,
      locked: !!note.locked,
      notebooks: note.notebooks || undefined,
      color: note.color,
      tags: note.tags || [],
      favorite: !!note.favorite,
      dateCreated: note.dateCreated,
      conflicted: !!note.conflicted,
      localOnly: !!note.localOnly,
    };

    if (!oldNote || oldNote.deleted) {
      if (note.color) await this._db.colors.add(note.color, id);

      for (let tag of note.tags) {
        if (!tag || !tag.trim()) continue;
        await this._db.tags.add(tag, id);
      }
    }

    await this._collection.addItem(note);
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

  get all() {
    return this._collection.getItems();
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

  /**
   * @private
   */
  _getTagItems(tagId, collection) {
    const tag = this._db[collection].tag(tagId);
    if (!tag || tag.noteIds.length <= 0) return [];
    const array = tag.noteIds.reduce((arr, id) => {
      const item = this._collection.getItem(id);
      if (item) arr.push(item);
      return arr;
    }, []);
    return sort(array).desc((note) => note.dateCreated);
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
      if (item.notebooks) {
        for (let notebook of item.notebooks) {
          for (let topic of notebook.topics) {
            await this._db.notebooks
              .notebook(notebook.id)
              .topics.topic(topic)
              .delete(id);
          }
        }
      }
      for (let tag of item.tags) {
        await this._db.tags.untag(tag, id);
      }
      if (item.data.color) {
        await this._db.colors.remove(item.data.color, id);
      }
      // await this._collection.removeItem(id);
      if (moveToTrash) await this._db.trash.add(itemData);
      else {
        await this._collection.removeItem(id);
        await this._db.content.remove(itemData.contentId);
      }
    }
  }

  async move(to, ...noteIds) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id || !to.topic)
      throw new Error(
        "The destination notebook must contain notebookId and topic."
      );
    let topic = this._db.notebooks.notebook(to.id).topics.topic(to.topic);
    if (!topic) throw new Error("No such topic exists.");
    await topic.add(...noteIds);
  }
}

function isNoteEmpty(note, content) {
  const { title, locked } = note;
  const isTitleEmpty = !title || !title.trim().length;
  return !locked && isTitleEmpty && content.isEmpty();
}

function getNoteHeadline(note, content) {
  if (note.locked) return "";
  return content.toHeadline();
}

function getNoteTitle(note, content) {
  if (note.title && note.title.trim().length > 0)
    return note.title.replace(/\r?\n/g, " ");
  return content.toTitle();
}
