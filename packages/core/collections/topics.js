/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Topic from "../models/topic";
import qclone from "qclone";
import id from "../utils/id";

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
    return (
      this.all.findIndex(
        (v) => v.id === topic || v.title === (topic.title || topic)
      ) > -1
    );
  }

  /* _dedupe(source) {
    let length = source.length,
      seen = new Map();
    for (let index = 0; index < length; index++) {
      let value = source[index];
      if (value.id) {
        seen.set(value.id, {
          ...seen.get(value.id),
          ...value,
        });
        continue;
      }
      let title = value.title || value;
      if (title.trim().length <= 0) continue;
      seen.set(title, value);
    }
    return seen;
  } */

  async add(...topics) {
    let notebook = qclone(this._db.notebooks.notebook(this._notebookId).data);

    let allTopics = [...notebook.topics, ...topics];

    notebook.topics = [];
    for (let t of allTopics) {
      let topic = makeTopic(t, this._notebookId);

      if (notebook.topics.findIndex((_topic) => _topic.title === t) > -1)
        continue;

      if (topic.title.length <= 0) continue;

      if (topics.findIndex((t) => topic.id === t.id) > -1)
        topic.dateEdited = Date.now();

      let index = notebook.topics.findIndex((t) => t.id === topic.id);
      if (index > -1) {
        notebook.topics[index] = {
          ...notebook.topics[index],
          ...topic
        };
      } else {
        notebook.topics.push(topic);
      }
    }
    return this._db.notebooks.add(notebook);
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
      topic = this.all.find((t) => t.id === topic || t.title === topic);
    }
    if (!topic) return;
    return new Topic(topic, this._notebookId, this._db);
  }

  async delete(...topicIds) {
    let allTopics = qclone(this.all);

    for (let topicId of topicIds) {
      const topic = this.topic(topicId);
      if (!topic) continue;

      await topic.clear();
      await this._db.shortcuts.remove(topicId);

      const topicIndex = allTopics.findIndex(
        (t) => t.id === topicId || t.title === topicId
      );
      allTopics.splice(topicIndex, 1);
    }

    await this._db.notebooks.add({ id: this._notebookId, topics: allTopics });
  }
}

// we export this for testing.
export function makeTopic(topic, notebookId) {
  if (typeof topic !== "string") return topic;
  return {
    type: "topic",
    id: id(), //topic,
    notebookId,
    title: topic.trim(),
    dateCreated: Date.now(),
    dateEdited: Date.now()
  };
}
