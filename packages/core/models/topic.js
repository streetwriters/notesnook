import Topics from "../collections/topics";

export default class Topic {
  /**
   *
   * @param {Topics} topics
   * @param {Object} topic
   */
  constructor(topics, topic) {
    this.topic = topic;
    this.topics = topics;
    this.transactionOpen = false;
  }

  transaction(ops, saveAfter = true) {
    this.transactionOpen = true;
    ops().then(() => {
      this.transactionOpen = false;
    });
    if (!saveAfter) return this;
    return this.save();
  }

  has(noteId) {
    return this.topic.notes.findIndex(n => n === noteId) > -1;
  }

  async add(...noteIds) {
    for (let noteId of noteIds) {
      let note = this.topics.notes.note(noteId);
      if (this.has(noteId) || !note) return this;

      this.topic.notes.push(noteId);

      if (note.notebook && note.notebook.id && note.notebook.topic) {
        if (
          note.notebook.id === this.topics.notebookId &&
          note.notebook.topic === this.topic.title
        )
          return this;
        await this.topics.notebooks
          .topics(note.notebook.id)
          .topic(note.notebook.topic)
          .delete(note.id);
      }
      await this.topics.notes.add({
        id: noteId,
        notebook: { id: this.topics.notebookId, topic: this.topic.title }
      });
    }
    this.topic.totalNotes++;
    return await this.save();
  }

  async delete(...noteIds) {
    for (let noteId of noteIds) {
      if (!this.has(noteId)) return this;
      let index = this.topic.notes.findIndex(n => n === noteId);
      this.topic.notes.splice(index, 1);
      await this.topics.notes.add({
        id: noteId,
        notebook: {}
      });
    }
    this.topic.totalNotes--;
    return await this.save();
  }

  async save() {
    if (this.transactionOpen) return this;
    await this.topics.add(this.topic);
    return this;
  }

  get all() {
    return this.topic.notes.map(note => this.topics.notes.note(note).note);
  }
}
