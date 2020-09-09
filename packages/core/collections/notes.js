import { groupBy, isHex } from "../utils";
import Collection from "./collection";
import sort from "fast-sort";
import {
  getWeekGroupFromTimestamp,
  months,
  getLastWeekTimestamp,
  get7DayTimestamp,
} from "../utils/date";
import Note from "../models/note";
import getId from "../utils/id";
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
    let deltaId = 0;
    let textId = 0;

    if (oldNote && oldNote.content) {
      deltaId = oldNote.content.delta;
      textId = oldNote.content.text;
    }

    let note = {
      ...oldNote,
      ...noteArg,
    };

    if (isNoteEmpty(note)) {
      if (oldNote) await this.delete(id);
      return;
    }

    const { text, delta } = note.content;

    if (!textId && isHex(text)) textId = text;
    if (!deltaId && isHex(delta)) deltaId = delta;

    if (delta && typeof delta === "object") {
      deltaId = await this._db.delta.add({
        noteId: id,
        id: deltaId,
        data: delta.data || delta,
        conflicted: delta.conflicted,
        resolved: delta.resolved,
      });
    }

    if (text !== textId) {
      textId = await this._db.text.add({
        noteId: id,
        id: textId,
        data: text,
      });
      note.title = getNoteTitle(note);
      note.headline = getNoteHeadline(note);
    }

    note = {
      id,
      type: "note",
      title: note.title,
      content: { text: textId, delta: deltaId },
      pinned: !!note.pinned,
      locked: !!note.locked,
      notebook: note.notebook || {},
      colors: note.colors || [],
      tags: note.tags || [],
      favorite: !!note.favorite,
      headline: note.headline,
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
    return this._collection.getAllItems();
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

  group(by, special = false) {
    let notes = !special
      ? tfun.filter(".pinned === false")(this.all)
      : this.all;
    notes = sort(notes).desc((t) => t.dateCreated);
    switch (by) {
      case "abc":
        return groupBy(notes, (note) => note.title[0].toUpperCase(), special);
      case "month":
        return groupBy(
          notes,
          (note) => months[new Date(note.dateCreated).getMonth()],
          special
        );
      case "week":
        return groupBy(
          notes,
          (note) => getWeekGroupFromTimestamp(note.dateCreated),
          special
        );
      case "year":
        return groupBy(
          notes,
          (note) => new Date(note.dateCreated).getFullYear().toString(),
          special
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
          special
        );
    }
  }

  async delete(...ids) {
    for (let id of ids) {
      let item = this.note(id);
      if (!item) continue;
      if (item.notebook && item.notebook.id && item.notebook.topic) {
        await this._collection.transaction(() =>
          this._db.notebooks
            .notebook(item.notebook.id)
            .topics.topic(item.notebook.topic)
            .delete(id)
        );
      }
      for (let tag of item.tags) {
        await this._db.tags.remove(tag, id);
      }
      for (let color of item.colors) {
        await this._db.colors.remove(color, id);
      }
      await this._collection.removeItem(id);
      await this._db.trash.add(item.data);
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

function isNoteEmpty(note) {
  if (!note.content) return true;
  const {
    title,
    content: { delta },
    locked,
  } = note;
  const text = getText(note);

  const isTitleEmpty = !title || !title.trim().length;
  const isTextEmpty = !isHex(text) && (!text || !text.trim().length);
  const isDeltaEmpty = !isHex(delta) && _isDeltaEmpty(delta);
  return !locked && isTitleEmpty && isTextEmpty && isDeltaEmpty;
}

function _isDeltaEmpty(delta) {
  let obj = delta;
  if (delta.constructor === Object) obj = delta.ops;

  return (
    !obj ||
    obj
      .map((o) => o.insert)
      .join("")
      .trim().length <= 0
  );
}

function getNoteHeadline(note) {
  if (note.locked) return "";
  const text = getText(note);
  return text.substring(0, 150) + (text.length > 150 ? "..." : "");
}

function getNoteTitle(note) {
  if (note.title && note.title.length > 0) return note.title.trim();
  const text = getText(note);
  return text.split(" ").slice(0, 3).join(" ").trim();
}

function getText(note) {
  if (!note.content || !note.content.text) return "";
  const { text } = note.content;
  if (text.data != null) return text.data;
  else if (text != null) return text;
  else return "";
}
