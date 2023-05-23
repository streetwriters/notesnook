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

import { navigate } from "../../navigation";
import Note from "../note";
import Notebook from "../notebook";
import Tag from "../tag";
import Topic from "../topic";
import TrashItem from "../trash-item";
import { db } from "../../common/db";
import { getTotalNotes } from "../../common";
import Reminder from "../reminder";
import type { Reminder as ReminderType } from "@notesnook/core/collections/reminders";
import { useMemo } from "react";

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_LINE_HEIGHT =
  (document.getElementById("p")?.clientHeight || 16) - 1;
export const DEFAULT_ITEM_HEIGHT = SINGLE_LINE_HEIGHT * 2 * DEFAULT_LINE_HEIGHT;
// const MAX_HEIGHTS = {
//   note: SINGLE_LINE_HEIGHT * 7 * DEFAULT_LINE_HEIGHT,
//   notebook: SINGLE_LINE_HEIGHT * 7 * DEFAULT_LINE_HEIGHT,
//   generic: SINGLE_LINE_HEIGHT * 4 * DEFAULT_LINE_HEIGHT
// };

export type Item = { id: string; type: string; title: string } & Record<
  string,
  unknown
>;

type NotebookReference = Item & { topics: string[] };
type NotebookType = Item & { topics: Item[] };

export type Context = { type: string } & Record<string, unknown>;
type ItemWrapperProps<TItem = Item> = {
  index: number;
  item: TItem;
  type: keyof typeof ListProfiles;
  context?: Context;
  compact?: boolean;
};

type ItemWrapper<TItem = Item> = (
  props: ItemWrapperProps<TItem>
) => JSX.Element;

const NotesProfile: ItemWrapper = ({ index, item, type, context, compact }) => {
  const references = useMemo(
    () => getReferences(item.id, item.notebooks as Item[], context?.type),
    [item, context]
  );

  return (
    <Note
      compact={compact}
      index={index}
      pinnable={!context}
      item={item}
      tags={getTags(item)}
      references={references}
      reminder={getReminder(item.id)}
      date={getDate(item, type)}
      context={context}
    />
  );
};

const NotebooksProfile: ItemWrapper = ({ index, item, type }) => (
  <Notebook
    index={index}
    item={item}
    totalNotes={getTotalNotes(item)}
    date={getDate(item, type)}
  />
);

const TagsProfile: ItemWrapper = ({ index, item }) => (
  <Tag item={item} index={index} />
);

const TopicsProfile: ItemWrapper = ({ index, item }) => (
  <Topic
    index={index}
    item={item}
    onClick={() => navigate(`/notebooks/${item.notebookId}/${item.id}`)}
  />
);

const RemindersProfile: ItemWrapper = ({ index, item }) => (
  <Reminder item={item as ReminderType} index={index} />
);

const TrashProfile: ItemWrapper = ({ index, item, type }) => (
  <TrashItem index={index} item={item} date={getDate(item, type)} />
);

export const ListProfiles = {
  home: NotesProfile,
  notebooks: NotebooksProfile,
  notes: NotesProfile,
  reminders: RemindersProfile,
  tags: TagsProfile,
  topics: TopicsProfile,
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

type Reference = {
  type: "topic" | "notebook";
  url: string;
  title: string;
};

function getReferences(
  noteId: string,
  notebooks: Item[],
  contextType?: string
): { dateEdited: number; references: Reference[] } | undefined {
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

function getDate(item: Item, groupType: keyof typeof ListProfiles) {
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
