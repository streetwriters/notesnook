import Topic from "../models/topic";
import { qclone } from "qclone";

export default class Topics {
  /**
   *
   * @param {import('../api').default} db
   * @param {string} notebookId
   */
  constructor(notebookId, db) {
    this._db = db;
    this._notebookId = notebookId;
  }

  has(topic) {
    return this.all.findIndex((v) => v.title === (topic.title || topic)) > -1;
  }

  _dedupe(source) {
    let length = source.length,
      seen = new Map();
    for (let index = 0; index < length; index++) {
      let value = source[index];
      if (value.id) {
        seen.set(value.id, {
          ...seen.get(value.id),
          ...value,
          id: value.title,
        });
        continue;
      }
      let title = value.title || value;
      if (title.trim().length <= 0) continue;
      seen.set(title, value);
    }
    return seen;
  }

  async add(...topics) {
    let notebook = qclone(this._db.notebooks.notebook(this._notebookId).data);

    let allTopics = [...notebook.topics, ...topics];
    const unique = this._dedupe(allTopics);

    notebook.topics = [];
    notebook.totalNotes = 0;
    unique.forEach((t) => {
      let topic = makeTopic(t, this._notebookId);
      notebook.topics.push(topic);
      notebook.totalNotes += topic.totalNotes;
    });

    return this._db.notebooks._collection.addItem(notebook);
  }

  /**
   * @returns {Array} an array containing all the topics
   */
  get all() {
    return this._db.notebooks.notebook(this._notebookId).data.topics;
  }

  /**
   *
   * @param {string | Object} topic can be an object or string containing the topic title.
   * @returns {Topic} The topic by the given title
   */
  topic(topic) {
    if (typeof topic === "string") {
      topic = this.all.find((t) => t.title === topic);
    }
    if (!topic) return;
    return new Topic(topic, this._notebookId, this._db);
  }

  async delete(...topicIds) {
    let allTopics = qclone(this.all); //FIXME: make a deep copy
    for (let i = 0; i < allTopics.length; i++) {
      let topic = allTopics[i];
      if (!topic) continue;
      let index = topicIds.findIndex((id) => topic.id === id);
      let t = this.topic(topic);
      await t.transaction(() => t.delete(...topic.notes), false);
      if (index > -1) {
        allTopics.splice(i, 1);
      }
    }
    await this._db.notebooks.add({ id: this._notebookId, topics: allTopics });
  }
}

function makeTopic(topic, notebookId) {
  if (typeof topic !== "string") return { ...topic, dateEdited: Date.now() };
  return {
    type: "topic",
    id: topic,
    notebookId,
    title: topic,
    dateCreated: Date.now(),
    dateEdited: Date.now(),
    totalNotes: 0,
    notes: [],
  };
}
