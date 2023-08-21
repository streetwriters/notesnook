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

import Database from "../api";
import { Note, Topic } from "../types";
import { clone } from "../utils/clone";

type TopicModel = Topic & {
  _topic: Topic;
  totalNotes: number;
  has: (noteId: string) => boolean;
  all: Note[];
  clear: () => Promise<void>;
};
export function createTopicModel(
  topic: Topic,
  notebookId: string,
  db: Database
): TopicModel {
  return Object.defineProperties(clone(topic), {
    _topic: {
      get: () => topic
    },
    totalNotes: {
      get: () => db.notes?.topicReferences.count(topic.id)
    },
    has: {
      value: (noteId: string) => {
        return db.notes.topicReferences.has(topic.id, noteId);
      }
    },
    all: {
      get: () => getAllNotes(db, topic.id)
    },
    clear: {
      value: () => {
        const noteIds = db.notes?.topicReferences.get(topic.id);
        if (!noteIds.length) return;

        return db.notes.removeFromNotebook(
          {
            topic: topic.id,
            id: notebookId,
            rebuildCache: true
          },
          ...noteIds
        );
      }
    }
  }) as TopicModel;
}

function getAllNotes(db: Database, topicId: string) {
  const noteIds = db.notes.topicReferences.get(topicId);
  return noteIds.reduce<Note[]>((arr, noteId) => {
    const note = db.notes.note(noteId);
    if (note) arr.push(note.data);
    return arr;
  }, []);
}
