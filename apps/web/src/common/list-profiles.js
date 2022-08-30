/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { navigate } from "../navigation/";
import Note from "../components/note";
import Notebook from "../components/notebook";
import Tag from "../components/tag";
import Topic from "../components/topic";
import TrashItem from "../components/trash-item";
import {
  getItemHeight,
  getNotebookHeight,
  getNoteHeight,
  MAX_HEIGHTS
} from "./height-calculator";
import { db } from "./db";
import { getTotalNotes } from ".";
import Attachment from "../components/attachment";

function createProfile(item, itemHeight, estimatedItemHeight) {
  return { item, itemHeight, estimatedItemHeight };
}

const NotesProfile = createProfile(
  (index, item, type, context) => (
    <Note
      index={index}
      pinnable={!context}
      item={item}
      tags={getTags(item)}
      notebook={getNotebook(item.notebooks, context?.type)}
      date={getDate(item, type)}
      context={context}
    />
  ),
  getNoteHeight,
  MAX_HEIGHTS.note
);

const NotebooksProfile = createProfile(
  (index, item, type) => (
    <Notebook
      index={index}
      item={item}
      totalNotes={getTotalNotes(item)}
      date={getDate(item, type)}
    />
  ),
  getNotebookHeight,
  MAX_HEIGHTS.notebook
);

const TagsProfile = createProfile(
  (index, item) => <Tag item={item} index={index} />,
  getItemHeight,
  MAX_HEIGHTS.generic
);

const TopicsProfile = createProfile(
  (index, item, _type, context) => (
    <Topic
      index={index}
      item={item}
      onClick={() => navigate(`/notebooks/${context.notebookId}/${item.id}`)}
    />
  ),
  getItemHeight,
  MAX_HEIGHTS.generic
);

const TrashProfile = createProfile(
  (index, item, type) => (
    <TrashItem index={index} item={item} date={getDate(item, type)} />
  ),
  (item) => {
    if (item.itemType === "note") return getNoteHeight(item);
    else if (item.itemType === "notebook") return getNotebookHeight(item);
  },
  Math.max(MAX_HEIGHTS.note, MAX_HEIGHTS.notebook)
);

const AttachmentProfile = createProfile(
  (index, item) => <Attachment index={index} item={item} />,
  (item) => getNoteHeight(item),
  Math.max(MAX_HEIGHTS.note, MAX_HEIGHTS.notebook)
);

const Profiles = {
  home: NotesProfile,
  notebooks: NotebooksProfile,
  notes: NotesProfile,
  tags: TagsProfile,
  topics: TopicsProfile,
  trash: TrashProfile,
  attachments: AttachmentProfile
};

export default Profiles;

function getTags(item) {
  let tags = item.tags;
  if (tags)
    tags = tags.slice(0, 3).reduce((prev, curr) => {
      const tag = db.tags.tag(curr);
      if (tag) prev.push(tag);
      return prev;
    }, []);
  return tags || [];
}

function getNotebook(notebooks, contextType) {
  if (contextType === "topic" || !notebooks?.length) return;

  const noteNotebook = notebooks[0];
  const topicId = noteNotebook.topics[0];

  const notebook = db.notebooks.notebook(noteNotebook.id)?.data;
  if (!notebook) return;

  const topic = notebook.topics.find((t) => t.id === topicId);
  if (!topic) return;

  return {
    id: notebook.id,
    title: notebook.title,
    dateEdited: notebook.dateEdited,
    topic: { id: topicId, title: topic.title }
  };
}

function getDate(item, groupType) {
  const sortBy = db.settings.getGroupOptions(groupType).sortBy;
  switch (sortBy) {
    case "dateEdited":
      return item.dateEdited;
    case "dateCreated":
      return item.dateCreated;
    case "dateModified":
      return item.dateModified;
    case "dateDeleted":
      return item.dateDeleted;
    default:
      return item.dateCreated;
  }
}
