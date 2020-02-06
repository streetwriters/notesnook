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

  exists(topic) {
    return this.all.findIndex(v => v.title === (topic.title || topic)) > -1;
  }

  async add(...topics) {
    let notebook = this.notebooks.notebook(this.notebookId);
    let uniqueTopics = [...notebook.data.topics, ...topics];
    uniqueTopics = uniqueTopics.filter(
      (v, i) =>
        v &&
        (v.title || v).trim().length > 0 &&
        uniqueTopics.findIndex(t => (v.title || v) === (t.title || t)) === i
    );
    notebook.data.topics = [];
    notebook.data.totalNotes = 0;
    for (let topic of uniqueTopics) {
      let t = makeTopic(topic, this.notebookId);
      notebook.data.topics.push(t);
      notebook.data.totalNotes += t.totalNotes;
    }
    await this.notebooks.collection.addItem(notebook.data);
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
    let allTopics = JSON.parse(JSON.stringify(this.all)); //FIXME: make a deep copy
    for (let i = 0; i < allTopics.length; i++) {
      let topic = allTopics[i];
      if (!topic) continue;
      let index = topics.findIndex(t => (t.title || t) === topic.title);
      let t = this.topic(topic);
      await t.transaction(() => t.delete(...topic.notes), false);
      if (index > -1) {
        allTopics.splice(i, 1);
      }
    }
    await this.notebooks.add({ id: this.notebookId, topics: allTopics });
  }
}

function makeTopic(topic, notebookId) {
  if (typeof topic !== "string") return topic;
  return {
    type: "topic",
    notebookId,
    title: topic,
    dateCreated: Date.now(),
    totalNotes: 0,
    notes: []
  };
}
