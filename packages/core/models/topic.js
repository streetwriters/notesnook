import Topics from "../collections/topics";
import { qclone } from "qclone";
export default class Topic {
  /**
   *
   * @param {Topics} topics
   * @param {Object} topic
   */
  constructor(topics, topic) {
    this._topic = topic;
    this._topics = topics;
    this._transactionOpen = false;
  }

  get totalNotes() {
    return this._topic.totalNotes;
  }

  transaction(ops, saveAfter = true) {
    this._transactionOpen = true;
    ops().then(() => {
      this._transactionOpen = false;
    });
    if (!saveAfter) return this;
    return this._save();
  }

  has(noteId) {
    return this._topic.notes.findIndex(n => n === noteId) > -1;
  }

  async add(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      let note = this._topics._notebooks._notes.note(noteId);
      if (this.has(noteId) || !note || note.data.deleted) continue;
      topic.notes.push(noteId);
      if (note.notebook && note.notebook.id && note.notebook.topic) {
        if (
          note.notebook.id === this._topics.notebookId &&
          note.notebook.topic === topic.title
        )
          return this;
        await this._topics._notebooks
          .notebook(note.notebook.id)
          .topics.topic(note.notebook.topic)
          .delete(note.id);
      }
      await this._topics._notebooks._notes.add({
        id: noteId,
        notebook: { id: this._topics._notebookId, topic: topic.title }
      });
      topic.totalNotes++;
    }
    return await this._save(topic);
  }

  async delete(...noteIds) {
    const topic = qclone(this._topic);
    for (let noteId of noteIds) {
      if (!this.has(noteId)) return this;
      let index = topic.notes.findIndex(n => n === noteId);
      topic.notes.splice(index, 1);
      await this._topics._notebooks._notes.add({
        id: noteId,
        notebook: {}
      });
      topic.totalNotes--;
    }
    return await this._save(topic);
  }

  async _save(topic) {
    if (this._transactionOpen) return this;
    await this._topics.add(topic);
    return this;
  }

  get all() {
    return this._topic.notes
      .map(note => {
        let fullNote = this._topics._notebooks._notes.note(note);
        if (fullNote) return fullNote.data;
      })
      .filter(v => v);
  }
}
