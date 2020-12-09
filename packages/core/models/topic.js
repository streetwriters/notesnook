import { qclone } from "qclone";
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
    return this._topic.totalNotes;
  }

  has(noteId) {
    return this._topic.notes.findIndex((n) => n === noteId) > -1;
  }

  async add(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      let note = this._db.notes.note(noteId);
      if (this.has(noteId) || !note || note.data.deleted) continue;
      topic.notes.push(noteId);

      let array = note.notebooks || [];
      const notebookIndex = array.findIndex((nb) => nb.id === this._notebookId);
      if (notebookIndex === -1) {
        let notebook = {};
        notebook.id = this._notebookId;
        notebook.topics = [topic.id];
        array.push(notebook);
      } else {
        const topicIndex = array[notebookIndex].topics.indexOf(topic.id);
        if (topicIndex > -1) return;
        array[notebookIndex].topics.push(topic.id);
      }

      await this._db.notes.add({
        id: noteId,
        notebooks: array,
      });
      topic.totalNotes++;
    }
    return await this._save(topic);
  }

  async delete(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      let note = this._db.notes.note(noteId);
      if (!this.has(noteId) || !note || note.data.deleted || !note.notebooks)
        return this;
      let index = topic.notes.indexOf(noteId);
      topic.notes.splice(index, 1);

      let array = note.notebooks;
      const notebookIndex = array.findIndex((nb) => nb.id === this._notebookId);
      if (notebookIndex === -1) return;

      const topicIndex = array[notebookIndex].topics.indexOf(topic.id);
      if (topicIndex === -1) return;

      array[notebookIndex].topics.splice(topicIndex, 1);
      if (array[notebookIndex].topics.length <= 0)
        array.splice(notebookIndex, 1);

      await this._db.notes.add({
        id: noteId,
        notebooks: array,
      });
      topic.totalNotes--;
    }
    return await this._save(topic);
  }

  async _save(topic) {
    await this._db.notebooks.notebook(this._notebookId).topics.add(topic);
    return this;
  }

  get all() {
    return this._topic.notes
      .map((note) => {
        let fullNote = this._db.notes.note(note);
        if (fullNote) return fullNote.data;
      })
      .filter((v) => v);
  }
}
