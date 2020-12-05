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

      const array = note.notebooks || [];
      if (
        array.some(
          (item) => item.id === this._notebookId && item.topic === topic.id
        )
      )
        return this;
      array.push({ id: this._notebookId, topic: topic.id });

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
      if (!this.has(noteId) || !note || note.data.deleted) return this;
      let index = topic.notes.findIndex((n) => n === noteId);
      topic.notes.splice(index, 1);

      const array = note.notebooks || [];
      index = array.findIndex(
        (n) => n.id === this._notebookId && n.topic === topic.id
      );
      array.splice(index, 1);

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
