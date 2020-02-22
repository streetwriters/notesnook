import Notebooks from "./notebooks";
import Notes from "./notes";
import Topic from "../models/topic";
import { qclone } from "qclone";

export default class Topics {
  /**
   *
   * @param {Notebooks} notebooks
   * @param {string} notebookId
   */
  constructor(notebooks, notebookId) {
    this._notebooks = notebooks;
    this._notebookId = notebookId;
  }

  has(topic) {
    return this.all.findIndex(v => v.title === (topic.title || topic)) > -1;
  }

  _dedupe(source) {
    let length = source.length,
      seen = new Map();
    for (let index = 0; index < length; index++) {
      let value = source[index];
      let title = value.title || value;
      if (title.trim().length <= 0) continue;
      seen.set(title, value);
    }
    return seen;
  }

  async add(...topics) {
    let notebook = { ...this._notebooks.notebook(this._notebookId).data };
    let allTopics = [...notebook.topics, ...topics];
    const unique = this._dedupe(allTopics);

    notebook.topics = [];
    notebook.totalNotes = 0;
    unique.forEach(t => {
      let topic = makeTopic(t, this._notebookId);
      notebook.topics.push(topic);
      notebook.totalNotes += topic.totalNotes;
    });

    return this._notebooks._collection.addItem(notebook);
  }

  /**
   * @returns {Array} an array containing all the topics
   */
  get all() {
    return this._notebooks.notebook(this._notebookId).data.topics;
  }

  /**
   *
   * @param {string | Object} topic can be an object or string containing the topic title.
   * @returns {Topic} The topic by the given title
   */
  topic(topic) {
    if (typeof topic === "string") {
      topic = this.all.find(t => t.title === topic);
    }
    if (!topic) return;
    return new Topic(this, topic);
  }

  async delete(...topics) {
    let allTopics = qclone(this.all); //FIXME: make a deep copy
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
    await this._notebooks.add({ id: this._notebookId, topics: allTopics });
  }
}

function makeTopic(topic, notebookId) {
  if (typeof topic !== "string") return { ...topic, dateEdited: Date.now() };
  return {
    type: "topic",
    notebookId,
    title: topic,
    dateCreated: Date.now(),
    dateEdited: Date.now(),
    totalNotes: 0,
    notes: []
  };
}
