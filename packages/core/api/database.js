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
import setManipulator from "../utils/set";

const KEYS = {
  notes: "notes",
  notebooks: "notebooks",
  trash: "trash",
  tags: "tags",
  user: "user"
};

const TYPES = {
  note: "note"
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
    this.tags = {};
    this.user = {};
    this.isInitialized = false;
  }

  init() {
    return new Promise((resolve, reject) => {
      for (let key of extractValues(KEYS)) {
        this.storage.read(key).then(data => {
          this[key] = data || {};
          if (key === KEYS.user) {
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
    return tfun.filter(".favorite === true")([
      ...this.getNotes(),
      ...this.getNotebooks()
    ]);
  }

  getPinned() {
    return tfun.filter(".pinned === true")(this.getNotes());
  }

  getTag(tag) {
    return tfun.filter(`.tags.includes('${tag}')`)(this.getNotes());
  }

  /**
   * @param {string} by One from 'abc', 'month', 'year' or 'week'. Leave it empty for default grouping.
   * @param {boolean} special Should only be used in the React app.
   */
  groupNotes(by, special = false) {
    let notes = !special
      ? tfun.filter(".pinned === false")(this.getNotes())
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

  async addNote(n) {
    if (!n) return;

    let timestamp = n.dateCreated || Date.now();
    let oldNote = this.notes[timestamp];
    let note = {
      ...oldNote,
      ...n
    };

    if (isNoteEmpty(note)) {
      if (oldNote) await this.deleteNotes(note);
      return;
    }

    note = {
      type: TYPES.note,
      title: getNoteTitle(note),
      content: getNoteContent(note),
      pinned: !!note.pinned,
      locked: !!note.locked,
      notebook: note.notebook || {},
      colors: note.colors || [],
      tags: note.tags || [],
      favorite: !!note.favorite,
      headline: getNoteHeadline(note),
      dateEditted: Date.now(),
      dateCreated: timestamp
    };

    if (oldNote) {
      note.colors = setManipulator.union(oldNote.colors, note.colors);
    } else {
      await addTags.call(this, note.tags);
    }

    this.notes[timestamp] = note;
    await this.storage.write(KEYS.notes, this.notes);
    return timestamp;
  }

  async addTag(noteId, tag) {
    if (!this.notes[noteId])
      throw new Error("Couldn't add tag. This note doesn't exist.");
    this.notes[noteId].tags.push(tag);
    await addTags.call(this, [tag]);
    await this.storage.write(KEYS.notes, this.notes);
  }

  async removeTag(noteId, tag) {
    if (!this.notes[noteId])
      throw new Error("Couldn't remove tag. This note doesn't exist.");
    let tags = this.notes[noteId].tags;
    if (tags.indexOf(tag) <= -1)
      throw new Error("This note is not tagged by the specified tag.");
    this.notes[noteId].tags.splice(tags.indexOf(tag), 1);
    await removeTags.call(this, [tag]);
    await this.storage.write(KEYS.notes, this.notes);
  }

  pinNote(id) {
    return editItem.call(this, "note", id, "pinned");
  }

  favoriteNote(id) {
    return editItem.call(this, "note", id, "favorite");
  }

  async deleteNotes(...noteIds) {
    return await deleteItems.call(this, noteIds, KEYS.notes);
  }

  getNote(id) {
    return getItem.call(this, id, KEYS.notes);
  }

  searchNotes(query, notes = null) {
    if (!query) return [];
    if (!notes) notes = this.getNotes();
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.content.text))(
      notes
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

  searchNotebooks(query) {
    if (!query) return [];
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.description))(
      this.getNotebooks()
    );
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
    if (topics.findIndex(topic => topic.title === "General") <= -1) {
      topics.splice(0, 0, makeTopic("General", id));
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
        topics[index] = makeTopic(topic, id);
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

  pinNotebook(id) {
    return editItem.call(this, "notebook", id, "pinned");
  }

  favoriteNotebook(id) {
    return editItem.call(this, "notebook", id, "favorite");
  }

  addTopicToNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      if (notebook.topics.findIndex(t => t.title === topic) > -1)
        return Promise.resolve(false); //check for duplicates
      notebook.topics[notebook.topics.length] = makeTopic(topic, notebookId);
      return Promise.resolve(true);
    });
  }

  deleteTopicFromNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      let topicIndex = notebook.topics.findIndex(t => t.title === topic);
      if (topicIndex === -1) return Promise.resolve(false);
      notebook.topics.splice(topicIndex, 1);
      return Promise.resolve(true);
    });
  }

  addNoteToTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      (notebook, topicIndex) => {
        if (notebook.topics[topicIndex].notes.includes(noteId)) {
          return Promise.resolve(false); //duplicate check
        }
        notebook.topics[topicIndex].notes.push(noteId);
        //increment totalNotes count
        notebook.topics[topicIndex].totalNotes++;
        notebook.totalNotes++;
        //add notebook to the note
        this.notes[noteId].notebook = {
          id: notebookId,
          topic: notebook.topics[topicIndex].title
        };
        return Promise.resolve(true);
      }
    );
  }

  deleteNoteFromTopic(notebookId, topic, noteId) {
    return topicNoteFn.call(
      this,
      notebookId,
      topic,
      noteId,
      (notebook, topicIndex) => {
        let index = notebook.topics[topicIndex].notes.indexOf(noteId);
        if (index <= -1) return Promise.resolve(false);
        notebook.topics[topicIndex].notes.splice(index, 1);
        //delete notebook from note
        this.notes[noteId].notebook = {};
        //decrement totalNotes count
        if (notebook.topics[topicIndex].totalNotes > 0)
          notebook.topics[topicIndex].totalNotes--;
        if (notebook.totalNotes > 0) notebook.totalNotes--;
        return Promise.resolve(true);
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

  async deleteNotebooks(...notebookIds) {
    return await deleteItems.call(this, notebookIds, KEYS.notebooks);
  }

  async moveNote(noteId, from, to) {
    if (!noteId || !to || !to.id || !to.topic) {
      throw new Error(`Error: Failed to move note.`);
    }
    if (!from.id && !from.topic) {
      return await this.addNoteToTopic(to.id, to.topic, noteId);
    } else {
      if (from.id === to.id && from.topic === to.topic) {
        throw new Error(
          "Moving to the same notebook and topic is not possible."
        );
      }

      if (await this.deleteNoteFromTopic(from.id, from.topic, noteId)) {
        return await this.addNoteToTopic(to.id, to.topic, noteId);
      }
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

  async createUser(user) {
    this.user = { ...this.user, ...user };
    await this.storage.write(KEYS.user, user);
  }
  getUser() {
    return this.user;
  }

  getTags() {
    return extractValues(this.tags);
  }
}

export default Database;

async function deleteItems(ids, key) {
  if (!ids || ids.length <= 0 || !this[key] || this[key].length <= 0) {
    return false;
  }
  for (let id of ids) {
    let item = key === KEYS.notes ? this.getNote(id) : this.getNotebook(id);
    if (!id || !item) continue;

    //delete note from the notebook too.
    switch (item.type) {
      case "note":
        if (
          item.notebook.hasOwnProperty("topic") &&
          !(await this.deleteNoteFromTopic(
            item.notebook.id,
            item.notebook.topic,
            item.dateCreated
          ))
        ) {
          continue;
        }
        for (let tag of item.tags) {
          this.tags[tag] = {
            ...this.tags[tag],
            count: this.tags[tag].count - 1
          };
        }
        break;
      case "notebook":
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
        if (skip) continue;
        break;
    }

    //put into trash
    this[KEYS.trash][item.dateCreated] = this[key][item.dateCreated];
    this[KEYS.trash][item.dateCreated]["dateDeleted"] = Date.now();
    this[KEYS.trash][item.dateCreated]["dType"] = key;

    delete this[key][item.dateCreated];
  }

  return this.storage
    .write(key, this[key])
    .then(s =>
      this.storage.write(KEYS.trash, this[KEYS.trash]).then(s => true)
    );
}

function notebookTopicFn(notebookId, topic, fn) {
  if (!notebookId || !topic || !this.notebooks[notebookId])
    return Promise.resolve(false);
  const notebook = this.notebooks[notebookId];

  return fn(notebook).then(res => {
    if (res === true) {
      this.notebooks[notebookId] = notebook;
      return this.storage.write(KEYS.notebooks, this.notebooks).then(s => true);
    }
    return false;
  });
}

function topicNoteFn(notebookId, topic, noteId, fn) {
  return notebookTopicFn.call(this, notebookId, topic, notebook => {
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1 || !this.notes.hasOwnProperty(noteId))
      return Promise.resolve(false);

    return fn(notebook, topicIndex).then(async res => {
      if (res) {
        return await this.storage.write(KEYS.notes, this.notes).then(s => true);
      } else {
        return Promise.resolve(false);
      }
    });
  });
}

function getItem(id, key) {
  checkInitialized.call(this);
  if (this[key].hasOwnProperty(id)) {
    return this[key][id];
  }
}

function makeTopic(topic, notebookId) {
  return {
    type: "topic",
    notebookId,
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

function getNoteContent(note) {
  if (note.locked) {
    return note.content;
  }
  return {
    text: note.content.text.trim(),
    delta: note.content.delta
  };
}

async function addTags(tags) {
  for (let tag of tags) {
    if (!tag || tag.trim().length <= 0) continue;
    let oldCount = this.tags[tag] ? this.tags[tag].count : 0;
    this.tags[tag] = {
      title: tag,
      count: oldCount + 1
    };
  }
  await this.storage.write(KEYS.tags, this.tags);
}

async function removeTags(tags) {
  for (let tag of tags) {
    if (!tag || tag.trim().length <= 0 || !this.tags[tag]) continue;
    let oldCount = this.tags[tag].count;
    if (oldCount <= 1) {
      delete this.tags[tag];
    } else {
      this.tags[tag] = {
        title: tag,
        count: oldCount - 1
      };
    }
  }
  await this.storage.write(KEYS.tags, this.tags);
}
