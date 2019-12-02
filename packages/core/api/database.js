import Storage from "../helpers/storage";
import fuzzysearch from "fuzzysearch";
import ff from "fast-filter";

const KEYS = {
  notes: "notes"
};

class Database {
  constructor(storage) {
    this.storage = new Storage(storage);
    this.notes = {};
  }

  /**
   * Get all notes from the database
   */
  async getNotes() {
    //update our cache
    this.notes = (await this.storage.read(KEYS.notes)) || {};
    return Object.values(this.notes);
  }

  /**
   * Adds or updates the note in the database
   * @param {object} note The note to add or update
   */
  async addNote(note) {
    if (!note || !note.content || note.content.length <= 0) return undefined;

    let timestamp = note.dateCreated || Date.now();
    //add or update a note into the database
    let title =
      note.title ||
      note.content.text
        .split(" ")
        .slice(0, 3)
        .join(" ");
    this.notes[timestamp] = {
      title,
      content: note.content,
      pinned: note.pinned || false,
      tags: note.tags || [],
      notebooks: note.notebooks || [],
      colors: note.colors || [],
      favorite: note.favorite || false,
      headline: note.content.text.substring(0, 60),
      length: note.content.text.length,
      dateEditted: Date.now(),
      dateCreated: timestamp
    };
    await this.storage.write(KEYS.notes, this.notes);
    return timestamp;
  }

  /**
   * Deletes one or more notes from the database
   * @param {array} notes the notes to be deleted
   */
  async deleteNotes(notes) {
    if (!notes || notes.length <= 0 || !this.notes || this.notes.length <= 0)
      return;
    for (let note of notes) {
      if (this.notes.hasOwnProperty(note.dateCreated)) {
        delete this.notes[note.dateCreated];
      }
    }
    await this.storage.write(KEYS.notes, this.notes);
  }

  /**
   * Gets a note from the database
   * @param {string} id the id of the note (must be a timestamp)
   */
  getNote(id) {
    if (this.notes.hasOwnProperty(id)) {
      return this.notes[id];
    }
  }

  /**
   * Searches all notes in the database with the given query
   * @param {string} query the search query
   */
  async searchNotes(query) {
    if (!query) return [];
    //TODO benchmark this and make it faster if necessary
    let notes = await this.getNotes();
    if (!notes) return;
    return ff(
      notes,
      v => fuzzysearch(query, v.title) || fuzzysearch(query, v.content.text),
      this
    );
  }

  //Notebooks
  getNotebooks() {}
  getNotebook() {}
  addNotebook() {}

  // Lists
  getLists() {}
  getList() {}
  addList() {}
  deleteLists() {}
}

export default Database;
