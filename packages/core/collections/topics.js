import Notebooks from "./notebooks";
import Notes from "./notes";

export default class Topics {
  /**
   *
   * @param {Notebooks} notebooks
   * @param {string} notebookId
   */
  constructor(notebooks, notebookId) {
    this.notebooks = notebooks;
    this.notebookId = notebookId;
    this.notes = new Notes(this.notebooks.context);
  }

  add(topic) {
    return this.notebooks.add({
      id: this.notebookId,
      topics: [topic]
    });
  }

  get all() {
    return this.notebooks.get(this.notebookId).topics;
  }

  get(topic) {
    let notebook = this.notebooks.get(this.notebookId);
    if (typeof topic === "string") {
      topic = notebook.topics.find(v => v.title === topic);
    }
    if (!topic)
      throw new Error("topics.get: Topic cannot be undefined or null.");
    if (!topic.notes)
      throw new Error("topics.get: Topic must contain an array of note ids.");
    return topic.notes.map(note => this.notes.get(note));
  }

  async delete(...topics) {
    let notebook = this.notebooks.get(this.notebookId);
    for (let topic of topics) {
      let index = notebook.topics.findIndex(t => (t.title = topic.title));
      if (index <= -1) continue;
      notebook.topics.splice(index, 1);
    }
    await this.notebooks.add({
      id: notebook.id,
      topics: notebook.topics
    });
  }
}
