import { groupBy, isHex } from "../utils";
import Collection from "./collection";
import {
  getWeekGroupFromTimestamp,
  months,
  getLastWeekTimestamp,
  get7DayTimestamp,
} from "../utils/date";
import Note from "../models/note";
import getId from "../utils/id";
import { EV } from "../common";
import { getContentFromData } from "../content-types";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Notes extends Collection {
  async add(noteArg) {
    if (!noteArg) return;
    if (noteArg.remote) {
      return await this._collection.addItem(noteArg);
    }

    let id = noteArg.id || getId();
    let oldNote = this._collection.getItem(id);

    let note = {
      ...oldNote,
      ...noteArg,
    };

    if (!oldNote && !noteArg.content) return;

    if (noteArg.content && noteArg.content.data && noteArg.content.type) {
      const { type, data, conflicted, resolved } = noteArg.content;

      let content = getContentFromData(type, data);
      if (!content) throw new Error("Invalid content type.");
      note.title = getNoteTitle(note, content);
      note.headline = getNoteHeadline(note, content);

      if (isNoteEmpty(note, content)) {
        if (oldNote) {
          EV.publish("notes:removeEmptyNote", id);
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
      notebook: note.notebook || undefined,
      colors: note.colors || [],
      tags: note.tags || [],
      favorite: !!note.favorite,
      dateCreated: note.dateCreated,
      conflicted: !!note.conflicted,
    };

    if (!oldNote) {
      for (let color of note.colors) {
        await this._db.colors.add(color, id);
      }

      for (let tag of note.tags) {
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
    return tfun.filter(".pinned === true")(this.all);
  }

  get conflicted() {
    return tfun.filter(".conflicted === true")(this.all);
  }

  get favorites() {
    return tfun.filter(".favorite === true")(this.all);
  }

  tagged(tag) {
    return this._db.tags.notes(tag).map((id) => this._collection.getItem(id));
  }

  colored(color) {
    return this._db.colors
      .notes(color)
      .map((id) => this._collection.getItem(id));
  }

  /**
   *
   * @param {"abc"|"month"|"year"|"week"|undefined} by
   * @param {"asc"|"desc"} sort
   */
  group(by, sort = "desc") {
    let notes = this.all;

    switch (by) {
      case "abc":
        return groupBy(
          notes,
          (note) => note.title[0].toUpperCase(),
          (t) => t.title[0],
          sort
        );
      case "month":
        return groupBy(
          notes,
          (note) => months[new Date(note.dateCreated).getMonth()],
          (t) => t.dateCreated,
          sort
        );
      case "week":
        return groupBy(
          notes,
          (note) => getWeekGroupFromTimestamp(note.dateCreated),
          (t) => t.dateCreated,
          sort
        );
      case "year":
        return groupBy(
          notes,
          (note) => new Date(note.dateCreated).getFullYear().toString(),
          (t) => t.dateCreated,
          sort
        );
      default:
        let timestamps = {
          recent: getLastWeekTimestamp(7),
          lastWeek: getLastWeekTimestamp(7) - get7DayTimestamp(), //seven day timestamp value
        };
        return groupBy(
          notes,
          (note) =>
            note.dateCreated >= timestamps.recent
              ? "Recent"
              : note.dateCreated >= timestamps.lastWeek
              ? "Last week"
              : "Older",
          (t) => t.dateCreated,
          sort
        );
    }
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
      if (item.notebook && item.notebook.id && item.notebook.topic) {
        await this._db.notebooks
          .notebook(item.notebook.id)
          .topics.topic(item.notebook.topic)
          .delete(id);
      }
      for (let tag of item.tags) {
        await this._db.tags.remove(tag, id);
      }
      for (let color of item.colors) {
        await this._db.colors.remove(color, id);
      }
      await this._collection.removeItem(id);
      if (moveToTrash) await this._db.trash.add(item.data);
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
