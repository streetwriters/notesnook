import { qclone } from "qclone";
import sort from "fast-sort";
import { deleteItem, findById } from "../utils/array";

export default class Topic {
  /**
   * @param {Object} topic
   * @param {string} notebookId
   * @param {import('../api').default} db
   */
  constructor(topic, notebookId, db) {
    this._topic = topic;
    this._db = db;
    this._notebookId = notebookId;
  }

  get totalNotes() {
    return this._topic.notes.length;
  }

  has(noteId) {
    return this._topic.notes.indexOf(noteId) > -1;
  }

  async add(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      let note = this._db.notes.note(noteId);
      if (!note || note.data.deleted) continue;

      const notebooks = note.notebooks || [];

      const noteNotebook = notebooks.find((nb) => nb.id === this._notebookId);
      const noteHasNotebook = !!noteNotebook;
      if (noteHasNotebook) {
        // 1 note can be inside multiple topics
        const noteHasTopic = noteNotebook.topics.indexOf(topic.id) > -1;
        if (noteHasTopic) continue;

        noteNotebook.topics.push(topic.id);
      } else {
        notebooks.push({
          id: this._notebookId,
          topics: [topic.id],
        });
      }

      await this._db.notes.add({
        id: noteId,
        notebooks,
      });

      if (!this.has(noteId)) {
        topic.notes.push(noteId);
        await this._save(topic);
      }
    }
  }

  async delete(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      let note = this._db.notes.note(noteId);
      if (
        !note ||
        note.deleted ||
        !deleteItem(topic.notes, noteId) ||
        !note.notebooks
      ) {
        continue;
      }

      let { notebooks } = note;

      const notebook = findById(notebooks, this._notebookId);
      if (!notebook) continue;

      const { topics } = notebook;
      if (!deleteItem(topics, topic.id)) continue;

      if (topics.length <= 0) deleteItem(notebooks, notebook);

      await this._db.notes.add({
        id: noteId,
        notebooks,
      });
    }
    return await this._save(topic);
  }

  async _save(topic) {
    await this._db.notebooks.notebook(this._notebookId).topics.add(topic);
    return this;
  }

  get all() {
    return this._topic.notes.reduce((arr, noteId) => {
      let note = this._db.notes.note(noteId);
      if (note) arr.push(note.data);
      return arr;
    }, []);
  }

  synced() {
    const notes = this._topic.notes;
    for (let id of notes) {
      if (!this._db.notes.exists(id)) return false;
    }
    return true;
  }
}
