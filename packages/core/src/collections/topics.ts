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

import { createTopicModel } from "../models/topic";
import { getId } from "../utils/id";
import Database from "../api";
import { clone } from "../utils/clone";
import { Topic } from "../types";

export default class Topics {
  constructor(
    private readonly notebookId: string,
    private readonly db: Database
  ) {}

  has(topic: string) {
    return this.all.findIndex((v) => v.id === topic || v.title === topic) > -1;
  }

  async add(...topics: Partial<Topic>[]) {
    const notebook = clone(this.db.notebooks.notebook(this.notebookId)?.data);
    if (!notebook) return;
    const allTopics = [...notebook.topics, ...topics];

    notebook.topics = [];
    for (const t of allTopics) {
      const topic = makeTopic(t, this.notebookId);
      if (!topic) continue;

      if (topics.findIndex((t) => t.id === topic.id) > -1)
        topic.dateEdited = Date.now();

      const index = notebook.topics.findIndex((t) => t.id === topic.id);
      if (index > -1) {
        notebook.topics[index] = {
          ...notebook.topics[index],
          ...topic
        };
      } else {
        notebook.topics.push(topic);
      }
    }
    return this.db.notebooks.collection.update(notebook);
  }

  get all() {
    return this.db.notebooks.notebook(this.notebookId)?.data.topics || [];
  }

  topic(idOrTitleOrTopic: string | Topic) {
    const topic =
      typeof idOrTitleOrTopic === "string"
        ? this.all.find(
            (t) => t.id === idOrTitleOrTopic || t.title === idOrTitleOrTopic
          )
        : idOrTitleOrTopic;
    if (!topic) return;
    return createTopicModel(topic, this.notebookId, this.db);
  }

  async delete(...topicIds: string[]) {
    const notebook = clone(this.db.notebooks.notebook(this.notebookId)?.data);
    if (!notebook) return;

    const allTopics = notebook.topics;
    for (const topicId of topicIds) {
      const topic = this.topic(topicId);
      if (!topic) continue;

      await topic.clear();
      await this.db.shortcuts.remove(topicId);

      const topicIndex = allTopics.findIndex(
        (t) => t.id === topicId || t.title === topicId
      );
      allTopics.splice(topicIndex, 1);
    }

    return this.db.notebooks.collection.update(notebook);
  }
}

// we export this for testing.
export function makeTopic(
  topic: Partial<Topic>,
  notebookId: string
): Topic | undefined {
  if (!topic.title) return;
  return {
    type: "topic",
    id: topic.id || getId(),
    notebookId: topic.notebookId || notebookId,
    title: topic.title.trim(),
    dateCreated: topic.dateCreated || Date.now(),
    dateEdited: topic.dateEdited || Date.now(),
    dateModified: Date.now()
  };
}
