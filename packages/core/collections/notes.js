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
      const { color, tags } = noteArg;

      if (oldNote) {
        if (!!oldNote.color && oldNote.color !== color) {
          await this._db.colors.untag(oldNote.color, id);
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

      return await this._collection.addItem(noteArg);
    }

    let note = {
      ...oldNote,
      ...noteArg,
    };

    if (oldNote) note.contentId = oldNote.contentId;

    if (!oldNote && !noteArg.content && !noteArg.contentId) return;

    if (noteArg.content && noteArg.content.data && noteArg.content.type) {
      const {
        type,
        data,
        conflicted,
        dateEdited,
        persistDateEdited,
        dateResolved,
      } = noteArg.content;

      let content = getContentFromData(type, data);
      if (!content) throw new Error("Invalid content type.");
      note.headline = getNoteHeadline(note, content);

      note.contentId = await this._db.content.add({
        noteId: id,
        id: note.contentId,
        type,
        data,
        localOnly: !!note.localOnly,
        dateEdited,
        dateResolved,
        conflicted,
        persistDateEdited,
      });
    }

    note = {
      id,
      contentId: note.contentId,
      type: "note",
      title: getNoteTitle(note, oldNote).replace(/[\r\n\t]+/g, " "),
      headline: note.headline,
      pinned: !!note.pinned,
      locked: !!note.locked,
      notebooks: note.notebooks || undefined,
      color: note.color,
      tags: note.tags || [],
      favorite: !!note.favorite,
      dateCreated: note.dateCreated,
      dateEdited: note.dateEdited,
      localOnly: !!note.localOnly,
      conflicted: !!note.conflicted,
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
      const item = this.note(id);
      if (item) arr.push(item.data);
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

      if (itemData.notebooks) {
        for (let notebook of itemData.notebooks) {
          const notebookRef = this._db.notebooks.notebook(notebook.id);
          if (!notebookRef) continue;

          for (let topicId of notebook.topics) {
            const topic = notebookRef.topics.topic(topicId);
            if (!topic) continue;

            await topic.delete(id);
          }
        }
      }

      for (let tag of itemData.tags) {
        await this._db.tags.untag(tag, id);
      }

      if (itemData.color) {
        await this._db.colors.untag(itemData.color, id);
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

  async repairReferences() {
    const notes = this.all;
    for (let note of notes) {
      const { notebooks } = note;
      if (!notebooks) continue;

      for (let notebook of notebooks) {
        const nb = this._db.notebooks.notebook(notebook.id);

        if (nb) {
          for (let topic of notebook.topics) {
            const _topic = nb.topics.topic(topic);
            if (!_topic || !_topic.has(note.id)) {
              deleteItem(notebook.topics, topic);
              await this.add(note);
              continue;
            }
          }
        }

        if (!nb || !notebook.topics.length) {
          deleteItem(notebooks, notebook);
          await this.add(note);
          continue;
        }
      }
    }
  }
}

function getNoteHeadline(note, content) {
  if (note.locked) return "";
  return content.toHeadline();
}

function getNoteTitle(note, oldNote) {
  if (note.title && note.title.trim().length > 0) return note.title;
  else if (oldNote && oldNote.title && oldNote.title.trim().length > 0) {
    return oldNote.title;
  }

  return `Note ${new Date().toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}
