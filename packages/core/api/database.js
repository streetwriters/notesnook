import Storage from "../helpers/storage";
import fuzzysearch from "fuzzysearch";
var tfun = require("transfun/transfun.js").tfun;
tfun = global.tfun;
import { extractValues, groupBy } from "../utils";
import { getWeekGroupFromTimestamp, months } from "../utils/date";

const KEYS = {
  notes: "notes",
  notebooks: "notebooks",
  trash: "trash"
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
          if (key === "notebooks") {
            this.isInitialized = true;
            //TODO use index here
            resolve(true);
          }
        });
      }
    });
  }

  /**
   * Get all notes
   */
  getNotes() {
    checkInitialized.call(this);
    return extractValues(this.notes).reverse();
  }

  /**
   * Group notes by given criteria
   * @param {string} by One from 'abc', 'month', 'year' or 'week'. Leave it empty for default grouping.
   */
  groupNotes(by) {
    //TODO add tests
    let notes = this.getNotes();
    switch (by) {
      case "abc":
        return groupBy(notes, note => note.title[0].toUpperCase());
      case "month":
        return groupBy(
          notes,
          note => months[new Date(note.dateCreated).getMonth()]
        );
      case "week":
        return groupBy(notes, note =>
          getWeekGroupFromTimestamp(note.dateCreated)
        );
      case "year":
        return groupBy(
          notes,
          note => months[new Date(note.dateCreated).getFullYear()]
        );
      default:
        let timestamps = {
          recent: getLastWeekTimestamp(7),
          lastWeek: getLastWeekTimestamp(7) - 604800000 //seven day timestamp value
        };
        return groupBy(notes, note =>
          note.dateCreated >= timestamps.recent
            ? "Recent"
            : note.dateCreated >= timestamps.lastWeek
            ? "Last week"
            : "Older"
        );
    }
  }

  /**
   * Adds or updates a note
   * @param {object} note The note to add or update
   */
  async addNote(note) {
    if (
      !note ||
      (!note.title &&
        (!note.content || !note.content.text || !note.content.delta))
    )
      return;

    let timestamp = note.dateCreated || Date.now();
    //add or update a note into the database
    let title =
      note.title ||
      note.content.text
        .split(" ")
        .slice(0, 3)
        .join(" ");
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

  /**
   * Deletes one or more notes
   * @param {array} notes the notes to be deleted
   */
  async deleteNotes(notes) {
    return await deleteItems.call(this, notes, KEYS.notes);
  }

  /**
   * Gets a note
   * @param {string} id the id of the note (must be a timestamp)
   */
  getNote(id) {
    return getItem.call(this, id, KEYS.notes);
  }

  /**
   * Searches all notes with the given query
   * @param {string} query the search query
   * @returns An array containing the filtered notes
   */
  searchNotes(query) {
    if (!query) return [];
    return tfun.filter(v => fuzzysearch(query, v.title + " " + v.content.text))(
      extractValues(this.notes)
    );
  }

  //TODO
  lockNote(note) {
    // this.notes[note.dateCreated].content = Encrypt(JSON.stringify(this.notes[note.dateCreated].content))
    // this.notes[note.dateCreated].locked = true
  }

  //TODO
  unlockNote(note, perm = false) {
    // this.notes[note.dateCreated].content = JSON.parse(Decrypt(this.notes[note.dateCreated].content))
    // if (perm) { this.notes[note.dateCreated].locked = false }
  }

  /**
   * Get all notebooks
   * @returns An array containing all the notebooks
   */
  getNotebooks() {
    checkInitialized.call(this);
    return extractValues(this.notebooks);
  }

  /**
   * Add a notebook
   * @param {object} notebook The notebook to add
   * @returns The ID of the added notebook
   */
  async addNotebook(notebook) {
    if (!notebook || !notebook.title) {
      return;
    }
    if (
      extractValues(this.notebooks).findIndex(
        nb => nb.title === notebook.title
      ) > -1
    ) {
      return;
    }

    const id = notebook.dateCreated || Date.now();
    let topics = [makeTopic("General")];
    for (let topic of notebook.topics) {
      if (
        !topic ||
        topic.trim().length <= 0 ||
        topics.findIndex(t => t.title === topic) > -1 //check for duplicate
      )
        continue;
      topics[topics.length] = makeTopic(topic);
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

  /**
   * Add a topic to the notebook
   * @param {number} notebookId The ID of notebook
   * @param {string} topic The topic to add
   */
  addTopicToNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      if (notebook.topics.findIndex(t => t.title === topic) > -1) return false; //check for duplicates
      notebook.topics[notebook.topics.length] = makeTopic(topic);
      return true;
    });
  }

  /**
   * Delete a topic from the notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to delete
   */
  deleteTopicFromNotebook(notebookId, topic) {
    return notebookTopicFn.call(this, notebookId, topic, notebook => {
      let topicIndex = notebook.topics.findIndex(t => t.title === topic);
      if (topicIndex === -1) return false;
      notebook.topics.splice(topicIndex, 1);
      return true;
    });
  }

  /**
   * Add a note to a topic in a notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to add note to
   * @param {number} noteId The ID of the note
   */
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

  /**
   * Delete a note from a topic in a notebook
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic to delete note from
   * @param {number} noteId The ID of the note
   */
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
        notebook.topics[topicIndex].totalNotes--;
        notebook.totalNotes--;
        return true;
      }
    );
  }

  /**
   * Get all the notes in a topic
   * @param {number} notebookId The ID of the notebook
   * @param {string} topic The topic
   * @returns An array containing the topic notes
   */
  getTopic(notebookId, topic) {
    if (!notebookId || !topic || !this.notebooks[notebookId]) return;
    let notebook = this.notebooks[notebookId];
    let topicIndex = notebook.topics.findIndex(t => t.title === topic);
    if (topicIndex === -1) return;
    let nbTopic = notebook.topics[topicIndex];
    if (nbTopic.notes.length <= 0) return [];
    return nbTopic.notes.map(note => this.getNote(note));
  }

  /**
   * Get a notebook
   * @param {number} id The ID of the notebook
   * @returns The notebook
   */
  getNotebook(id) {
    return getItem.call(this, id, KEYS.notebooks);
  }

  /**
   * Delete notebooks
   * @param {array} notebooks The notebooks to delete
   */
  async deleteNotebooks(notebooks) {
    return await deleteItems.call(this, notebooks, KEYS.notebooks);
  }

  async moveNote(noteId, from, to) {
    if (
      !noteId ||
      !from ||
      !to ||
      !from.notebook ||
      !to.notebook ||
      !from.topic ||
      !to.topic ||
      (from.notebook === to.notebook && from.topic === to.topic) //moving to same notebook and topic shouldn't be possible
    )
      return false;
    if (await this.deleteNoteFromTopic(from.notebook, from.topic, noteId)) {
      return await this.addNoteToTopic(to.notebook, to.topic, noteId);
    }
    return false;
  }

  async restoreItem(id) {
    if (!this.trash.hasOwnProperty(id)) {
      return;
    }
    let type = this.trash[id].dType;
    delete this.trash[id].dateDeleted;
    delete this.trash[id].dType;
    let item = this.trash[id];
    this[type][id] = item;
    await this.storage.write(type, this[type]);
  }

  getTrash() {
    return extractValues(this.trash).reverse();
  }
}

export default Database;

function deleteItems(items, key) {
  if (!items || items.length <= 0 || !this[key] || this[key].length <= 0)
    return false;
  for (let item of items) {
    if (!item) continue;
    if (this[key].hasOwnProperty(item.dateCreated)) {
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
