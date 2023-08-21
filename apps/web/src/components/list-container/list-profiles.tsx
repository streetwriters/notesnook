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
import { ReferencesWithDateEdited, Reference, Context } from "./types";
import {
  GroupingKey,
  Item,
  NotebookReference
} from "@notesnook/core/dist/types";
import { getSortValue } from "@notesnook/core/dist/utils/grouping";

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_LINE_HEIGHT =
  (document.getElementById("p")?.clientHeight || 16) - 1;
export const DEFAULT_ITEM_HEIGHT = SINGLE_LINE_HEIGHT * 2 * DEFAULT_LINE_HEIGHT;

type ListItemWrapperProps<TItem = Item> = {
  group?: GroupingKey;
  item: TItem;
  context?: Context;
  compact?: boolean;
};
export function ListItemWrapper(props: ListItemWrapperProps) {
  const { item, group, compact, context } = props;
  const { type } = item;

  switch (type) {
    case "note": {
      const tags = db.relations.to(item, "tag").resolved(3) || [];
      const color = db.relations.to(item, "color").resolved(1)?.[0];
      const references = getReferences(item.id, item.notebooks, context?.type);
      return (
        <Note
          compact={compact}
          item={item}
          tags={tags}
          color={color}
          references={references}
          reminder={getReminder(item.id)}
          date={getDate(item, group)}
          context={context}
        />
      );
    }
    case "notebook":
      return (
        <Notebook
          item={item}
          totalNotes={getTotalNotes(item)}
          date={getDate(item, group)}
        />
      );
    case "trash":
      return <TrashItem item={item} date={getDate(item, type)} />;
    case "reminder":
      return <Reminder item={item} />;
    case "topic":
      return <Topic item={item} />;
    case "tag":
      return <Tag item={item} />;
    default:
      return null;
  }
}

function getReferences(
  noteId: string,
  notebooks?: NotebookReference[],
  contextType?: string
): ReferencesWithDateEdited | undefined {
  if (["topic", "notebook"].includes(contextType || "")) return;

  const references: Reference[] = [];
  let latestDateEdited = 0;

  db.relations
    ?.to({ id: noteId, type: "note" }, "notebook")
    ?.resolved()
    .forEach((notebook) => {
      references.push({
        type: "notebook",
        url: `/notebooks/${notebook.id}`,
        title: notebook.title
      });

      if (latestDateEdited < notebook.dateEdited)
        latestDateEdited = notebook.dateEdited;
    });

  notebooks?.forEach((curr) => {
    const topicId = (curr as NotebookReference).topics[0];
    const notebook = db.notebooks.notebook(curr.id)?.data;
    if (!notebook) return;

    const topic = notebook.topics.find((t) => t.id === topicId);
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
  return db.relations
    ?.from({ id: noteId, type: "note" }, "reminder")
    .resolved(1)[0];
}

function getDate(item: Item, groupType?: GroupingKey): number {
  return getSortValue(
    groupType
      ? db.settings.getGroupOptions(groupType)
      : {
          groupBy: "default",
          sortBy: "dateEdited",
          sortDirection: "desc"
        },
    item
  );
}
