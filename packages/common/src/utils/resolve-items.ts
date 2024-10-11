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

import {
  Color,
  Item,
  Reminder,
  Notebook,
  Tag,
  getUpcomingReminder
} from "@notesnook/core";
import { database as db } from "../database.js";

type WithDateEdited<T> = { items: T[]; dateEdited: number };
export type NotebooksWithDateEdited = WithDateEdited<Notebook>;
export type TagsWithDateEdited = WithDateEdited<Tag>;

function withDateEdited<
  T extends { dateEdited: number } | { dateModified: number }
>(items: T[]): WithDateEdited<T> {
  let latestDateEdited = 0;
  items.forEach((item) => {
    const date = "dateEdited" in item ? item.dateEdited : item.dateModified;
    if (latestDateEdited < date) latestDateEdited = date;
  });
  return { dateEdited: latestDateEdited, items };
}

export async function resolveItems(ids: string[], items: Item[]) {
  if (!ids.length || !items.length) return [];

  const { type } = items[0];
  if (type === "note") return resolveNotes(ids);
  else if (type === "notebook") {
    return Promise.all(ids.map((id) => db.notebooks.totalNotes(id)));
  } else if (type === "tag") {
    return Promise.all(
      ids.map((id) => db.relations.from({ id, type: "tag" }, "note").count())
    );
  }
  return [];
}

export type NoteResolvedData = {
  notebooks?: NotebooksWithDateEdited;
  reminder?: Reminder;
  color?: Color;
  tags?: TagsWithDateEdited;
  attachments?: {
    failed: number;
    total: number;
  };
  locked?: boolean;
};

async function resolveNotes(ids: string[]) {
  const relations = [
    ...(await db.relations
      .to({ type: "note", ids }, ["notebook", "tag", "color"])
      .get()),
    ...(await db.relations
      .from({ type: "note", ids }, ["reminder", "attachment"])
      .get())
  ];
  const lockedReference = await db
    .sql()
    .selectFrom("content")
    .where("noteId", "in", ids)
    .select(["noteId", "locked"])
    .execute();

  const relationIds: {
    notebooks: Set<string>;
    colors: Set<string>;
    tags: Set<string>;
    reminders: Set<string>;
    attachments: Set<string>;
  } = {
    colors: new Set(),
    notebooks: new Set(),
    tags: new Set(),
    reminders: new Set(),
    attachments: new Set()
  };

  const grouped: Record<
    string,
    {
      notebooks: string[];
      color?: string;
      tags: string[];
      reminders: string[];
      attachments: string[];
      locked?: boolean;
    }
  > = {};

  for (const relation of relations) {
    const noteId =
      relation.toType === "reminder" || relation.toType === "attachment"
        ? relation.fromId
        : relation.toId;
    const data = grouped[noteId] || {
      notebooks: [],
      tags: [],
      attachments: [],
      reminders: []
    };

    if (relation.toType === "attachment") {
      data.attachments.push(relation.toId);
      relationIds.attachments.add(relation.toId);
    } else if (relation.toType === "reminder") {
      data.reminders.push(relation.toId);
      relationIds.reminders.add(relation.toId);
    } else if (relation.fromType === "notebook" && data.notebooks.length < 2) {
      data.notebooks.push(relation.fromId);
      relationIds.notebooks.add(relation.fromId);
    } else if (relation.fromType === "tag" && data.tags.length < 3) {
      data.tags.push(relation.fromId);
      relationIds.tags.add(relation.fromId);
    } else if (relation.fromType === "color" && !data.color) {
      data.color = relation.fromId;
      relationIds.colors.add(relation.fromId);
    }
    grouped[noteId] = data;
  }

  for (const ref of lockedReference) {
    if (!ref.noteId) continue;
    grouped[ref.noteId] = grouped[ref.noteId] || {
      attachments: [],
      notebooks: [],
      reminders: [],
      tags: []
    };
    grouped[ref.noteId].locked = !!ref.locked;
  }

  const resolved = {
    notebooks: await db.notebooks.all.records(
      Array.from(relationIds.notebooks)
    ),
    tags: await db.tags.all.records(Array.from(relationIds.tags), {
      sortBy: "title",
      sortDirection: "desc"
    }),
    colors: await db.colors.all.records(Array.from(relationIds.colors)),
    reminders: await db.reminders.all.records(
      Array.from(relationIds.reminders)
    ),
    attachments: await db.attachments.all.records(
      Array.from(relationIds.attachments)
    )
  };

  const data: NoteResolvedData[] = [];
  for (const noteId of ids) {
    const group = grouped[noteId];
    if (!group) {
      data.push({});
      continue;
    }

    data.push({
      color: group.color ? resolved.colors[group.color] : undefined,
      reminder: getUpcomingReminder(
        group.reminders.map((id) => resolved.reminders[id]).filter(Boolean)
      ),
      tags: withDateEdited(
        group.tags.map((id) => resolved.tags[id]).filter(Boolean)
      ),
      notebooks: withDateEdited(
        group.notebooks.map((id) => resolved.notebooks[id]).filter(Boolean)
      ),
      locked: group.locked,
      attachments: {
        total: group.attachments.length,
        failed: group.attachments.filter(
          (id) => !!resolved.attachments[id]?.failed
        ).length
      }
    });
  }
  return data;
}

export function isNoteResolvedData(data: unknown): data is NoteResolvedData {
  return (
    typeof data === "object" &&
    !!data &&
    "notebooks" in data &&
    "reminder" in data &&
    "color" in data &&
    "tags" in data
  );
}
