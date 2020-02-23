import CachedCollection from "../database/cached-collection";
import fuzzysearch from "fuzzysearch";
import Tags from "./tags";
import { groupBy } from "../utils";
import sort from "fast-sort";
import {
  getWeekGroupFromTimestamp,
  months,
  getLastWeekTimestamp
} from "../utils/date";
import Storage from "../database/storage";
import Notebooks from "./notebooks";
import Note from "../models/note";
import Trash from "./trash";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Notes {
  constructor(context) {
    this._collection = new CachedCollection(context, "notes");
    this._deltaStorage = new Storage(context);
  }

  /**
   *
   * @param {Notebooks} notebooks
   * @param {Trash} trash
   */
  async init(notebooks, trash, tags, colors) {
    await this._collection.init();
    this._notebooks = notebooks;
    this._trash = trash;
    this._tagsCollection = tags;
    this._colorsCollection = colors;
  }

  async add(noteArg) {
    if (!noteArg) return;

    let id = noteArg.id || Date.now().toString() + "_note";
    let oldNote = this._collection.getItem(id);
    let note = {
      ...oldNote,
      ...noteArg
    };

    if (isNoteEmpty(note)) {
      if (oldNote) await this.delete(id);
      return;
    }

    if (!(note.content.delta instanceof String)) {
      await this._deltaStorage.write(id + "_delta", note.content.delta);
    }

    note = {
      id,
      type: "note",
      title: getNoteTitle(note),
      content: getNoteContent(note, id),
      pinned: !!note.pinned,
      locked: !!note.locked,
      notebook: note.notebook || {},
      colors: note.colors || [],
      tags: note.tags || [],
      favorite: !!note.favorite,
      headline: getNoteHeadline(note),
      dateCreated: note.dateCreated
    };

    if (!oldNote) {
      for (let color of note.colors) {
        await this._colorsCollection.add(color);
      }

      for (let tag of note.tags) {
        await this._tagsCollection.add(tag);
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
    let note = id.type ? id : this._collection.getItem(id);
    if (!note) return undefined;
    return new Note(this, note);
  }

  get all() {
    return this._collection.getAllItems();
  }

  get pinned() {
    return tfun.filter(".pinned === true")(this.all);
  }

  get favorites() {
    return tfun.filter(".favorite === true")(this.all);
  }

  tagged(tag) {
    return tfun.filter(`.tags.includes('${tag}')`)(this.all);
  }

  colored(color) {
    return tfun.filter(`.colors.includes('${color}')`)(this.all);
  }

  filter(query) {
    if (!query) return [];
    let queryFn = v => fuzzysearch(query, v.title + " " + v.content.text);
    if (query instanceof Function) queryFn = query;
    return tfun.filter(queryFn)(this.all);
  }

  group(by, special = false) {
    let notes = !special
      ? tfun.filter(".pinned === false")(this.all)
      : this.all;
    switch (by) {
      case "abc":
        return groupBy(
          //notes.sort((a, b) => a.title.localeCompare(b.title)),
          sort(notes).asc(t => t.title),
          note => note.title[0].toUpperCase(),
          special
        );
      case "month":
        return groupBy(
          notes,
          note => months[new Date(note.dateCreated).getMonth()],
          special
        );
      case "week":
        return groupBy(
          notes,
          note => getWeekGroupFromTimestamp(note.dateCreated),
          special
        );
      case "year":
        return groupBy(
          notes,
          note => new Date(note.dateCreated).getFullYear().toString(),
          special
        );
      default:
        let timestamps = {
          recent: getLastWeekTimestamp(7),
          lastWeek: getLastWeekTimestamp(7) - 604800000 //seven day timestamp value
        };
        return groupBy(
          notes,
          note =>
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
          this._notebooks
            .notebook(item.notebook.id)
            .topics.topic(item.notebook.topic)
            .delete(id)
        );
      }
      for (let tag of item.tags) {
        await this._tagsCollection.remove(tag);
      }
      await this._collection.removeItem(id);
      await this._trash.add(item.data);
    }
  }

  async move(to, ...noteIds) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id || !to.topic)
      throw new Error(
        "The destination notebook must contain notebookId and topic."
      );
    let topic = this._notebooks.notebook(to.id).topics.topic(to.topic);
    if (!topic) throw new Error("No such topic exists.");
    await topic.transaction(async () => {
      await topic.add(...noteIds);
    });
  }
}

function isNoteEmpty(note) {
  return (
    !note.content ||
    !note.content.delta ||
    (!note.locked &&
      (!note.title || note.title.trim().length <= 0) &&
      (!note.content.text || note.content.text.trim().length <= 0))
  );
}

function getNoteHeadline(note) {
  if (note.locked) return "";
  return (
    note.content.text.substring(0, 150) +
    (note.content.text.length > 150 ? "..." : "")
  );
}

function getNoteTitle(note) {
  if (note.title && note.title.length > 0) return note.title.trim();
  return note.content.text
    .split(" ")
    .slice(0, 3)
    .join(" ")
    .trim();
}

function getNoteContent(note, id) {
  if (note.locked) {
    return note.content;
  }

  return {
    text: note.content.text.trim(),
    delta: id + "_delta"
  };
}
