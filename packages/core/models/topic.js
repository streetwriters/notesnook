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
      if (this.has(noteId) || !note || note.data.deleted) continue;

      let array = note.notebooks || [];
      const notebookIndex = array.findIndex((nb) => nb.id === this._notebookId);
      if (notebookIndex === -1) {
        let notebook = {};
        notebook.id = this._notebookId;
        notebook.topics = [topic.id];
        array.push(notebook);
      } else {
        const topicIndex = array[notebookIndex].topics.indexOf(topic.id);
        if (topicIndex > -1) {
          if (!this.has(noteId)) topic.notes.push(noteId);
          continue;
        }

        array[notebookIndex].topics.push(topic.id);
      }

      await this._db.notes.add({
        id: noteId,
        notebooks: array,
      });

      topic.notes.push(noteId);
    }
    return await this._save(topic);
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
    const notes = this._topic.notes.reduce((arr, noteId) => {
      let note = this._db.notes.note(noteId);
      if (note) arr.push(note.data);
      return arr;
    }, []);
    return sort(notes).desc((note) => note.dateCreated);
  }
}
