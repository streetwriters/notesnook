import Notebooks from "./notebooks";
import Notes from "./notes";
import Topic from "../models/topic";

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
    return this.notebooks.notebook(this.notebookId).data.topics;
  }

  topic(topic) {
    if (typeof topic === "string") {
      topic = this.all.find(t => t.title === topic);
    }
    if (!topic) return;
    return new Topic(this, topic);
  }

  async delete(...topics) {
    let notebook = this.notebooks.notebook(this.notebookId);
    if (!notebook) return;
    notebook = notebook.data;
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
