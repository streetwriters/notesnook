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

import Note from "../note";
import Notebook from "../notebook";
import Tag from "../tag";
import Topic from "../topic";
import TrashItem from "../trash-item";
import { db } from "../../common/db";
import { getTotalNotes } from "@notesnook/common";
import Reminder from "../reminder";
import { useMemo } from "react";
import {
  ReferencesWithDateEdited,
  ItemWrapper,
  Item,
  NotebookReference,
  NotebookType,
  Reference
} from "./types";

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_LINE_HEIGHT =
  (document.getElementById("p")?.clientHeight || 16) - 1;
export const DEFAULT_ITEM_HEIGHT = SINGLE_LINE_HEIGHT * 2 * DEFAULT_LINE_HEIGHT;

const NotesProfile: ItemWrapper = ({ item, type, context, compact }) => {
  const references = useMemo(
    () => getReferences(item.id, item.notebooks as Item[], context?.type),
    [item, context]
  );

  return (
    <Note
      compact={compact}
      item={item}
      tags={getTags(item)}
      references={references}
      reminder={getReminder(item.id)}
      date={getDate(item, type)}
      context={context}
    />
  );
};

const NotebooksProfile: ItemWrapper = ({ item, type }) => (
  <Notebook
    item={item}
    totalNotes={getTotalNotes(item)}
    date={getDate(item, type)}
  />
);

const TrashProfile: ItemWrapper = ({ item, type }) => (
  <TrashItem item={item} date={getDate(item, type)} />
);

export const ListProfiles = {
  home: NotesProfile,
  notebooks: NotebooksProfile,
  notes: NotesProfile,
  reminders: Reminder,
  tags: Tag,
  topics: Topic,
  trash: TrashProfile
} as const;

function getTags(item: Item) {
  let tags = item.tags as Item[];
  if (tags)
    tags = tags.slice(0, 3).reduce((prev, curr) => {
      const tag = db.tags?.tag(curr);
      if (tag) prev.push(tag);
      return prev;
    }, [] as Item[]);
  return tags || [];
}

function getReferences(
  noteId: string,
  notebooks: Item[],
  contextType?: string
): ReferencesWithDateEdited | undefined {
  if (["topic", "notebook"].includes(contextType || "")) return;

  const references: Reference[] = [];
  let latestDateEdited = 0;

  db.relations
    ?.to({ id: noteId, type: "note" }, "notebook")
    ?.forEach((notebook: any) => {
      references.push({
        type: "notebook",
        url: `/notebooks/${notebook.id}`,
        title: notebook.title
      } as Reference);

      if (latestDateEdited < notebook.dateEdited)
        latestDateEdited = notebook.dateEdited;
    });

  notebooks?.forEach((curr) => {
    const topicId = (curr as NotebookReference).topics[0];
    const notebook = db.notebooks?.notebook(curr.id)?.data as NotebookType;
    if (!notebook) return;

    const topic = notebook.topics.find((t: Item) => t.id === topicId);
    if (!topic) return;

    references.push({
      url: `/notebooks/${curr.id}/${topicId}`,
      title: topic.title,
      type: "topic"
    });
    if (latestDateEdited < (topic.dateEdited as number))
      latestDateEdited = topic.dateEdited as number;
  });

  return { dateEdited: latestDateEdited, references: references.slice(0, 3) };
}

function getReminder(noteId: string) {
  return db.relations?.from({ id: noteId, type: "note" }, "reminder")[0];
}

function getDate(item: Item, groupType: keyof typeof ListProfiles): number {
  const sortBy = db.settings?.getGroupOptions(groupType).sortBy;
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
