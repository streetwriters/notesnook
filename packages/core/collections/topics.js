import Notebooks from "./notebooks";
import Notes from "./notes";

export default class Topics {
  /**
   *
   * @param {Notebooks} notebooks
   * @param {Notes} notes
   * @param {string} notebookId
   */
  constructor(notebooks, notes, notebookId) {
    this.notebooks = notebooks;
    this.notebookId = notebookId;
    this.notes = notes;
  }

  async add(topic) {
    await this.notebooks.add({
      id: this.notebookId,
      topics: [topic]
    });
    return this.topic(topic);
  }

  get all() {
    return this.notebooks.get(this.notebookId).topics;
  }

  topic(topic) {
    if (typeof topic === "string") {
      topic = this.all.find(t => t.title === topic);
    }
    if (!topic) return;
    return new Topic(this, topic);
  }

  async delete(...topics) {
    let notebook = this.notebooks.get(this.notebookId);
    for (let topic of topics) {
      if (!topic) continue;
      let index = notebook.topics.findIndex(
        t => t.title === topic.title || topic
      );
      if (index <= -1) continue;
      topic = notebook.topics[index];
      let t = this.topic(topic);
      await t.transaction(() => t.delete(...topic.notes), false);
      notebook.topics.splice(index, 1);
    }
    await this.notebooks.add({
      id: notebook.id,
      topics: notebook.topics
    });
  }
}

class Topic {
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
      let note = this.topics.notes.get(noteId);
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
    return await this.save();
  }

  save() {
    if (this.transactionOpen) return this;
    return this.topics.add(this.topic);
  }

  get all() {
    return this.topic.notes.map(note => this.topics.notes.get(note));
  }
}
