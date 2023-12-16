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
  GroupHeader,
  GroupOptions,
  GroupingKey,
  Item,
  ItemType,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem,
  VirtualizedGrouping
} from "@notesnook/core";
import { getSortValue } from "@notesnook/core/dist/utils/grouping";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { eSendEvent } from "../../services/event-manager";
import { RouteName } from "../../stores/use-navigation-store";
import { eOpenJumpToDialog } from "../../utils/events";
import { SectionHeader } from "../list-items/headers/section-header";
import { NoteWrapper } from "../list-items/note/wrapper";
import { NotebookWrapper } from "../list-items/notebook/wrapper";
import ReminderItem from "../list-items/reminder";
import TagItem from "../list-items/tag";

export type WithDateEdited<T> = { items: T[]; dateEdited: number };
export type NotebooksWithDateEdited = WithDateEdited<Notebook>;
export type TagsWithDateEdited = WithDateEdited<Tag>;

type ListItemWrapperProps<TItem = Item> = {
  group?: GroupingKey;
  items: VirtualizedGrouping<TItem> | undefined;
  isSheet: boolean;
  index: number;
  renderedInRoute?: RouteName;
  customAccentColor?: string;
  dataType: string;
  scrollRef: any;
  groupOptions: GroupOptions;
};

export function ListItemWrapper(props: ListItemWrapperProps) {
  const { items, group, isSheet, index, groupOptions } = props;
  const [item, setItem] = useState<Item>();
  const tags = useRef<TagsWithDateEdited>();
  const notebooks = useRef<NotebooksWithDateEdited>();
  const reminder = useRef<Reminder>();
  const color = useRef<Color>();
  const totalNotes = useRef<number>(0);
  const attachmentsCount = useRef(0);
  const [groupHeader, setGroupHeader] = useState<GroupHeader>();
  const previousIndex = useRef<number>();
  const refreshTimeout = useRef<NodeJS.Timeout>();
  const currentItemId = useRef<string>();

  const refreshItem = useCallback((resolvedItem: any) => {
    if (!resolvedItem || !resolvedItem.data) {
      tags.current = undefined;
      notebooks.current = undefined;
      reminder.current = undefined;
      color.current = undefined;
      attachmentsCount.current = 0;
      totalNotes.current = 0;
    }

    if (resolvedItem && resolvedItem.item) {
      const data = resolvedItem.data;
      if (resolvedItem.item.type === "note" && isNoteResolvedData(data)) {
        tags.current = data.tags;
        notebooks.current = data.notebooks;
        reminder.current = data.reminder;
        color.current = data.color;
        attachmentsCount.current = data.attachmentsCount || 0;
      } else if (
        resolvedItem.item.type === "notebook" &&
        typeof data === "number"
      ) {
        totalNotes.current = data;
      } else if (resolvedItem.item.type === "tag" && typeof data === "number") {
        totalNotes.current = data;
      }
      currentItemId.current = resolvedItem.item.id;
      setItem(resolvedItem.item);
      setGroupHeader(resolvedItem.group);
    }
  }, []);

  if (previousIndex.current !== index) {
    previousIndex.current = index;
    const resolvedItem = items?.cacheItem(index);
    refreshItem(resolvedItem);
  }

  useEffect(() => {
    (async function () {
      try {
        clearTimeout(refreshTimeout.current);
        const idx = index;
        refreshTimeout.current = setTimeout(async () => {
          if (idx !== previousIndex.current) {
            return;
          }
          const resolvedItem = await items?.item(idx, resolveItems);
          if (idx !== previousIndex.current) {
            console.log("cancel", idx, previousIndex.current);
            return;
          }

          refreshItem(resolvedItem);
        }, 100);
      } catch (e) {
        console.log("Error", e);
      }
    })();
  }, [index, items, refreshItem]);

  if (!item)
    return (
      <View
        style={{
          height: 120,
          width: "100%"
        }}
      />
    );

  const type = ((item as TrashItem).itemType || item.type) as ItemType;
  switch (type) {
    case "note": {
      return (
        <>
          {groupHeader && previousIndex.current === index ? (
            <SectionHeader
              screen={props.renderedInRoute}
              item={groupHeader}
              index={index}
              dataType={item.type}
              color={props.customAccentColor}
              groupOptions={groupOptions}
              onOpenJumpToDialog={() => {
                eSendEvent(eOpenJumpToDialog, {
                  ref: props.scrollRef,
                  data: items
                });
              }}
            />
          ) : null}

          <NoteWrapper
            item={item as Note}
            tags={tags.current}
            color={color.current}
            notebooks={notebooks.current}
            reminder={reminder.current}
            attachmentsCount={attachmentsCount.current}
            date={getDate(item, group)}
            isRenderedInActionSheet={isSheet}
            index={index}
          />
        </>
      );
    }
    case "notebook":
      return (
        <>
          {groupHeader && previousIndex.current === index ? (
            <SectionHeader
              screen={props.renderedInRoute}
              item={groupHeader}
              index={index}
              dataType={item.type}
              color={props.customAccentColor}
              groupOptions={groupOptions}
              onOpenJumpToDialog={() => {
                eSendEvent(eOpenJumpToDialog, {
                  ref: props.scrollRef,
                  data: items
                });
              }}
            />
          ) : null}
          <NotebookWrapper
            item={item as Notebook}
            totalNotes={totalNotes.current}
            date={getDate(item, group)}
            index={index}
          />
        </>
      );

    case "reminder":
      return (
        <>
          {groupHeader && previousIndex.current === index ? (
            <SectionHeader
              screen={props.renderedInRoute}
              item={groupHeader}
              index={index}
              dataType={item.type}
              color={props.customAccentColor}
              groupOptions={groupOptions}
              onOpenJumpToDialog={() => {
                eSendEvent(eOpenJumpToDialog, {
                  ref: props.scrollRef,
                  data: items
                });
              }}
            />
          ) : null}
          <ReminderItem
            item={item as Reminder}
            index={index}
            isSheet={isSheet}
          />
        </>
      );
    case "tag":
      return (
        <>
          {groupHeader && previousIndex.current === index ? (
            <SectionHeader
              screen={props.renderedInRoute}
              item={groupHeader}
              index={index}
              dataType={item.type}
              color={props.customAccentColor}
              groupOptions={groupOptions}
              onOpenJumpToDialog={() => {
                eSendEvent(eOpenJumpToDialog, {
                  ref: props.scrollRef,
                  data: items
                });
              }}
            />
          ) : null}
          <TagItem
            item={item as Tag}
            index={index}
            totalNotes={totalNotes.current}
          />
        </>
      );
    default:
      return null;
  }
}

function getDate(item: Item, groupType?: GroupingKey): number {
  return (
    getSortValue(
      groupType
        ? db.settings.getGroupOptions(groupType)
        : {
            groupBy: "default",
            sortBy: "dateEdited",
            sortDirection: "desc"
          },
      item
    ) || 0
  );
}

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

type NoteResolvedData = {
  notebooks?: NotebooksWithDateEdited;
  reminder?: Reminder;
  color?: Color;
  tags?: TagsWithDateEdited;
  attachmentsCount?: number;
};
async function resolveNotes(ids: string[]) {
  console.time("relations");
  const relations = [
    ...(await db.relations
      .to({ type: "note", ids }, ["notebook", "tag", "color"])
      .get()),
    ...(await db.relations.from({ type: "note", ids }, "reminder").get())
  ];
  console.timeEnd("relations");
  const relationIds: {
    notebooks: Set<string>;
    colors: Set<string>;
    tags: Set<string>;
    reminders: Set<string>;
  } = {
    colors: new Set(),
    notebooks: new Set(),
    tags: new Set(),
    reminders: new Set()
  };

  const grouped: Record<
    string,
    {
      notebooks: string[];
      color?: string;
      tags: string[];
      reminder?: string;
    }
  > = {};
  for (const relation of relations) {
    const noteId =
      relation.toType === "reminder" ? relation.fromId : relation.toId;
    const data = grouped[noteId] || {
      notebooks: [],
      tags: []
    };

    if (relation.toType === "reminder" && !data.reminder) {
      data.reminder = relation.toId;
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

  console.time("resolve");
  const resolved = {
    notebooks: await db.notebooks.all.records(
      Array.from(relationIds.notebooks)
    ),
    tags: await db.tags.all.records(Array.from(relationIds.tags)),
    colors: await db.colors.all.records(Array.from(relationIds.colors)),
    reminders: await db.reminders.all.records(Array.from(relationIds.reminders))
  };
  console.timeEnd("resolve");

  const data: NoteResolvedData[] = [];
  for (const noteId of ids) {
    const group = grouped[noteId];
    if (!group) {
      data.push({});
      continue;
    }

    data.push({
      color: group.color ? resolved.colors[group.color] : undefined,
      reminder: group.reminder ? resolved.reminders[group.reminder] : undefined,
      tags: withDateEdited(
        group.tags.map((id) => resolved.tags[id]).filter(Boolean)
      ),
      notebooks: withDateEdited(
        group.notebooks.map((id) => resolved.notebooks[id]).filter(Boolean)
      ),
      attachmentsCount:
        (await db.attachments?.ofNote(noteId, "all").ids())?.length || 0
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
