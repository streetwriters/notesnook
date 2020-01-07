import Storage from "../helpers/storage";
import fuzzysearch from "fuzzysearch";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}
import { extractValues, groupBy } from "../utils";
import {
  getWeekGroupFromTimestamp,
  months,
  getLastWeekTimestamp
} from "../utils/date";

const KEYS = {
  notes: "notes",
  notebooks: "notebooks",
  trash: "trash",
  tags: "tags"
};

function checkInitialized() {
  if (!this.isInitialized) {
    throw new Error(
      "Database is not initialized. Make sure to call await init() on startup."
    );
  }
}

class Database {
  constructor(storage) {
    this.storage = new Storage(storage);
    this.notes = {};
    this.notebooks = {};
    this.trash = {};
    this.isInitialized = false;
  }

  init() {
    return new Promise((resolve, reject) => {
      for (let key of extractValues(KEYS)) {
        this.storage.read(key).then(data => {
          this[key] = data || {};
          if (key === KEYS.tags) {
            this.isInitialized = true;
            //TODO use index here
            resolve(true);
          }
        });
      }
    });
  }

  getNotes() {
    checkInitialized.call(this);
    return extractValues(this.notes).reverse();
  }

  getFavorites() {
    return tfun.filter(".favorite == true")([
      ...this.getNotes(),
      ...this.getNotebooks()
    ]);
  }

  getPinned() {
    return tfun.filter(".pinned == true")(this.getNotes());
  }

  /**
   * @param {string} by One from 'abc', 'month', 'year' or 'week'. Leave it empty for default grouping.
   * @param {boolean} special Should only be used in the React app.
   */
  groupNotes(by, special = false) {
    let notes = !special
      ? tfun.filter(".pinned == false")(this.getNotes())
      : this.getNotes();
    switch (by) {
      case "abc":
        return groupBy(
          notes.sort((a, b) => a.title.localeCompare(b.title)),
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

  async addNote(note) {
    if (
      !note ||
      (!note.title &&
        (!note.content || !note.content.text || !note.content.delta))
    )
      return;
    let timestamp = note.dateCreated || Date.now();
    note = { ...this.notes[timestamp], ...note };
    //add or update a note into the database
    let title =
      note.title ||
      note.content.text
        .split(" ")
        .slice(0, 3)
        .join(" ");

    //if note exists
    if (this.notes[timestamp] !== undefined) {
      let oldNote = this.notes[timestamp];
      //if we are having new colors
      if (oldNote.colors !== note.colors && note.colors) {
        note.colors = mergeDedupe([oldNote.colors, note.colors]);
      }
      //if we are having new tags
      //TODO add new tags to the tags collection...
      if (oldNote.tags !== note.tags && note.tags) {
        note.tags = mergeDedupe([oldNote.tags, note.tags]);
      }
    }

    this.notes[timestamp] = {
      type: "note",
      title,
      content: note.content,
      pinned: note.pinned || false,
      tags: note.tags || [],
      notebook: note.notebook || {},
      colors: note.colors || [],
      favorite: note.favorite || false,
      headline:
        note.content.text.substring(0, 150) +
        (note.content.text.length > 150 ? "..." : ""),
      length: note.content.text.length,
      dateEditted: Date.now(),
      dateCreated: timestamp
    };
    await this.storage.write(KEYS.notes, this.notes);
    return timestamp;
  }

  //TODO only send unique values here...
  async updateTags(tags) {
    for (let tag of tags) {
      this[KEYS.tags][tag] = {
        title: tag,
        count: this[KEYS.tags][tag].count + 1
      };
    }
    await this.storage.write(KEYS.tags, this[KEYS.tags]);
  }

  pinItem(type, id) {
    return editItem.call(this, type, id, "pinned");
  }

  favoriteItem(type, id) {
    return editItem.call(this, type, id, "favorite");
  }

  async deleteNotes(notes) {
    return await deleteItems.call(this, notes, KEYS.notes);
  }

  getNote(id) {
    return getItem.call(this, id, KEYS.notes);
  }

  searchNotes(query) {
    if (!query) return [];
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.content.text))(
      extractValues(this.notes)
    );
  }

  async lockNote(noteId, password) {
    if (!this.notes[noteId]) {
      throw new Error(`Cannot lock note. Invalid ID: ${noteId} given.`);
    }

    this.notes[noteId].content = await this.storage.encrypt(
      password,
      JSON.stringify(this.notes[noteId].content)
    );
    this.notes[noteId].locked = true;
    await this.storage.write(KEYS.notes, this.notes);
    return true;
  }

  async unlockNote(noteId, password, perm = false) {
    if (!this.notes[noteId]) {
      throw new Error(`Cannot unlock note. Invalid ID: ${noteId} given.`);
    }
    let decrypted = await this.storage.decrypt(
      password,
      this.notes[noteId].content
    );
    if (perm) {
      this.notes[noteId].locked = false;
      this.notes[noteId].content = JSON.parse(decrypted);
      await this.storage.write(KEYS.notes, this.notes);
    }
    return { ...this.notes[noteId], content: JSON.parse(decrypted) };
  }

  getNotebooks() {
    checkInitialized.call(this);
    return extractValues(this.notebooks);
  }

  async addNotebook(notebook) {
    if (!notebook || !notebook.title) {
      return;
    }
    if (
      extractValues(this.notebooks).findIndex(
        nb =>
          nb.title === notebook.title && nb.dateCreated !== notebook.dateCreated
      ) > -1
    ) {
      return;
    }

    const id = notebook.dateCreated || Date.now();
    let topics =
      !notebook.topics || notebook.topics.length <= 0 ? [] : notebook.topics; //
    if (notebook.topics.findIndex(topic => topic.title === "General") <= -1) {
      topics.splice(0, 0, makeTopic("General"));
    }
    let index = 0;

    for (let topic of topics) {
      if (
        !topic ||
        topics.findIndex(t => t.title === (topic || topic.title)) > -1 //check for duplicate
      ) {
        topics.splice(index, 1);
        continue;
      }
      if (typeof topic === "string") {
        if (topic.trim().length <= 0) topics.splice(index, 1);
        topics[index] = makeTopic(topic);
      }
      index++;
    }

    this.notebooks[id] = {
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      dateCreated: id,
      pinned: notebook.pinned || false,
      favorite: notebook.favorite || false,
      topics,
      totalNotes: 0,
      tags: [],
      colors: []
    };
    await this.storage.write(KEYS.notebooks, this.notebooks);
    return id;
  }

  addTopicToNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      if (notebook.topics.findIndex(t => t.title === topic) > -1) return false; //check for duplicates
      notebook.topics[notebook.topics.length] = makeTopic(topic);
      return true;
    });
  }

  deleteTopicFromNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      let topicIndex = notebook.topics.findIndex(t => t.title === topic);
      if (topicIndex === -1) return false;
      notebook.topics.splice(topicIndex, 1);
      return true;
    });
  }

  addNoteToTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      (notebook, topicIndex) => {
        if (notebook.topics[topicIndex].notes.indexOf(noteId) > -1)
          return false; //duplicate check
        notebook.topics[topicIndex].notes.push(noteId);
        //increment totalNotes count
        notebook.topics[topicIndex].totalNotes++;
        notebook.totalNotes++;
        //add notebook to the note
        this.notes[noteId].notebook = {
          notebook: notebookId,
          topic: notebook.topics[topicIndex].title
        };
        return true;
      }
    );
  }

  deleteNoteFromTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      async (notebook, topicIndex) => {
        let index = notebook.topics[topicIndex].notes.indexOf(noteId);
        if (index <= -1) return false;
        notebook.topics[topicIndex].notes.splice(index, 1);
        //delete notebook from note
        this.notes[noteId].notebook = {};
        //decrement totalNotes count
        if (notebook.topics[topicIndex].totalNotes > 0)
          notebook.topics[topicIndex].totalNotes--;
        if (notebook.totalNotes > 0) notebook.totalNotes--;
        return true;
      }
    );
  }

  getTopic(notebookId, topic) {
    if (!notebookId || !topic || !this.notebooks[notebookId]) return;
    let notebook = this.notebooks[notebookId];
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1) return;
    let nbTopic = notebook.topics[topicIndex];
    if (nbTopic.notes.length <= 0) return [];
    return nbTopic.notes.map(note => this.getNote(note));
  }

  getNotebook(id) {
    return getItem.call(this, id, KEYS.notebooks);
  }

  async deleteNotebooks(notebooks) {
    return await deleteItems.call(this, notebooks, KEYS.notebooks);
  }

  async moveNote(noteId, from, to) {
    if (!noteId || !to || !to.notebook || !to.topic) {
      throw new Error(`Error: Failed to move note.`);
    }
    if (!from.notebook && !from.topic) {
      return await this.addNoteToTopic(to.notebook, to.topic, noteId);
    } else if (
      await this.deleteNoteFromTopic(from.notebook, from.topic, noteId)
    ) {
      if (from.notebook === to.notebook && from.topic === to.topic) {
        throw new Error(
          "Moving to the same notebook and topic is not possible."
        );
      }
      return await this.addNoteToTopic(to.notebook, to.topic, noteId);
    }
    return false;
  }

  async restoreItem(id) {
    if (!this.trash.hasOwnProperty(id)) {
      throw new Error("Cannot restore: This item is not present in trash.");
    }
    let type = this.trash[id].dType;
    delete this.trash[id].dateDeleted;
    delete this.trash[id].dType;
    let item = this.trash[id];
    this[type][id] = item;
    await this.storage.write(type, this[type]);
  }

  getTrash() {
    checkInitialized.call(this);
    return extractValues(this.trash).reverse();
  }

  async clearTrash() {
    this[KEYS.trash] = {};
    await this.storage.write(KEYS.trash, this[KEYS.trash]);
  }
}

export default Database;

async function deleteItems(items, key) {
  if (!items || items.length <= 0 || !this[key] || this[key].length <= 0)
    return false;
  for (let item of items) {
    if (!item) continue;
    if (this[key].hasOwnProperty(item.dateCreated)) {
      //delete note from the notebook too.
      if (item.type === "note" && item.notebook.hasOwnProperty("topic")) {
        if (
          !(await this.deleteNoteFromTopic(
            item.notebook.notebook,
            item.notebook.topic,
            item.dateCreated
          ))
        ) {
          continue;
        }
      } else if (item.type === "notebook") {
        let skip = false;
        for (let topic in item.topics) {
          for (let note in topic.notes) {
            if (
              !(await this.deleteNoteFromTopic(item.dateCreated, topic, note))
            ) {
              skip = true;
              break;
            }
          }
        }
        if (skip) {
          continue;
        }
      }
      //put into trash
      this[KEYS.trash][item.dateCreated] = this[key][item.dateCreated];
      this[KEYS.trash][item.dateCreated]["dateDeleted"] = Date.now();
      this[KEYS.trash][item.dateCreated]["dType"] = key;

      delete this[key][item.dateCreated];
    }
  }

  return this.storage
    .write(key, this[key])
    .then(s =>
      this.storage.write(KEYS.trash, this[KEYS.trash]).then(s => true)
    );
}

function notebookTopicFn(notebookId, topic, fn) {
  if (!notebookId || !topic || !this.notebooks[notebookId]) return false;
  const notebook = this.notebooks[notebookId];
  let result = fn(notebook);

  const saveNotebooks = () => {
    this.notebooks[notebookId] = notebook;
    return this.storage.write(KEYS.notebooks, this.notebooks).then(s => true);
  };

  if (result instanceof Promise) {
    return result.then(res => {
      if (res === true) {
        return saveNotebooks();
      }
      return false;
    });
  }

  if (result === true) {
    return saveNotebooks();
  }

  return result;
}

function topicNoteFn(notebookId, topic, noteId, fn) {
  return notebookTopicFn.call(this, notebookId, topic, async notebook => {
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1 || !this.notes.hasOwnProperty(noteId)) return false;

    if ((await fn(notebook, topicIndex)) === true) {
      return await this.storage.write(KEYS.notes, this.notes).then(s => true);
    }
    return false;
  });
}

function getItem(id, key) {
  checkInitialized.call(this);
  if (this[key].hasOwnProperty(id)) {
    return this[key][id];
  }
}

function makeTopic(topic) {
  return {
    type: "topic",
    title: topic,
    dateCreated: Date.now(),
    totalNotes: 0,
    notes: []
  };
}

async function editItem(type, id, prop) {
  switch (type) {
    case "notebook":
    case "note":
      let col = type == "note" ? this.notes : this.notebooks;
      let func = type == "note" ? this.addNote : this.addNotebook;
      if (col[id] === undefined) {
        throw new Error(`Wrong ${type} id.`);
      }
      let state = col[id][prop];
      let edit = { [prop]: !state };
      await func.call(this, { ...col[id], ...edit });
      break;
    default:
      throw new Error("Invalid type given to pinItem");
  }
}

function mergeDedupe(arr) {
  return [...new Set([].concat(...arr))];
}
