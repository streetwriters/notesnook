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
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Notes {
  constructor(context) {
    this.collection = new CachedCollection(context, "notes");
    this.deltaStorage = new Storage(context);
    this.tagsCollection = new Tags(context);
  }

  /**
   *
   * @param {Notebooks} notebooks
   */
  async init(notebooks) {
    await this.collection.init();
    this.notebooks = notebooks;
    await this.tagsCollection.init();
  }

  async add(noteArg) {
    if (!noteArg) return;

    let id = noteArg.id || Date.now().toString() + "_note";
    let oldNote = this.get(id);
    let note = {
      ...oldNote,
      ...noteArg
    };

    if (isNoteEmpty(note)) {
      if (oldNote) await this.delete(id);
      return;
    }

    await this.deltaStorage.write(id + "_delta", note.content.delta);

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
      dateEdited: Date.now(),
      dateCreated: note.dateCreated || Date.now()
    };

    if (oldNote) {
      // note.colors = setManipulator.union(oldNote.colors, note.colors);
    } else {
      for (let tag of note.tags) {
        await this.tagsCollection.add(tag);
      }
    }

    await this.collection.addItem(note);
    return note.id;
  }

  async delta(id) {
    return await this.deltaStorage.read(id + "_delta");
  }

  get(id) {
    return this.collection.getItem(id);
  }

  get all() {
    return this.collection.getAllItems();
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
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.content.text))(
      this.all
    );
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
      let item = this.get(id);
      if (!id) continue;
      if (item.notebook && item.notebook.id && item.notebook.topic) {
        await this.collection.transaction(() =>
          this.notebooks
            .topics(item.notebook.id)
            .topic(item.notebook.topic)
            .delete(id)
        );
      }
      for (let tag of item.tags) {
        await this.tagsCollection.remove(tag);
      }
      await this.collection.removeItem(id);
    }
  }

  get tags() {
    return this.tagsCollection.all();
  }

  async tag(id, tag) {
    let note = await this.get(id);
    if (!note)
      throw new Error(`Couldn't add tag. No note found with id: ${id}.`);
    note.tags.push(tag);
    await this.tagsCollection.add(tag);
    await this.collection.addItem(note);
  }

  async untag(id, tag) {
    let note = await this.get(id);
    if (!note)
      throw new Error(`Couldn't add tag. No note found with id: ${id}.`);
    if (note.tags.indexOf(tag) <= -1)
      throw new Error("This note is not tagged by the specified tag.");
    note.tags.splice(note.tags.indexOf(tag), 1);
    await this.tagsCollection.remove(tag);
    await this.collection.addItem(note);
  }

  async move(to, ...noteIds) {
    if (!to) throw new Error("The destination notebook cannot be undefined.");
    if (!to.id || !to.topic)
      throw new Error(
        "The destination notebook must contain notebookId and topic."
      );
    let topic = this.notebooks.topics(to.id).topic(to.topic);
    if (!topic) throw new Error("No such topic exists.");
    await topic.transaction(async () => {
      await topic.add(...noteIds);
    });
  }

  async favorite(id) {
    await this.add({ id, favorite: true });
  }

  async unfavorite(id) {
    await this.add({ id, favorite: false });
  }

  async pin(id) {
    await this.add({ id, pinned: true });
  }

  async unpin(id) {
    await this.add({ id, pinned: false });
  }

  async lock(id, password) {
    let note = await this.get(id);
    if (!note)
      throw new Error(`Couldn't lock note. No note found with id: ${id}.`);
    note.content = await this.collection.indexer.encrypt(
      password,
      JSON.stringify(note.content)
    );
    note.locked = true;
    await this.collection.addItem(note);
    return true;
  }

  async unlock(id, password, perm = false) {
    let note = await this.get(id);
    if (!note)
      throw new Error(`Couldn't unlock note. No note found with id: ${id}.`);
    let decrypted = await this.collection.indexer.decrypt(
      password,
      note.content
    );
    if (perm) {
      note.locked = false;
      note.content = JSON.parse(decrypted);
      await this.collection.addItem(note);
    }
    return { ...note, content: JSON.parse(decrypted) };
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
