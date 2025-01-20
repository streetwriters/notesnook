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
  NotebooksWithDateEdited,
  TagsWithDateEdited,
  isNoteResolvedData,
  resolveItems
} from "@notesnook/common";
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
  VirtualizedGrouping,
  getSortValue
} from "@notesnook/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { useIsCompactModeEnabled } from "../../hooks/use-is-compact-mode-enabled";
import { eSendEvent } from "../../services/event-manager";
import { RouteName } from "../../stores/use-navigation-store";
import { eOpenJumpToDialog } from "../../utils/events";
import { SectionHeader } from "../list-items/headers/section-header";
import { NoteWrapper } from "../list-items/note/wrapper";
import { NotebookWrapper } from "../list-items/notebook/wrapper";
import ReminderItem from "../list-items/reminder";
import TagItem from "../list-items/tag";

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
  const locked = useRef(false);
  const compactMode = useIsCompactModeEnabled(props.dataType as ItemType);

  const refreshItem = useCallback((resolvedItem: any) => {
    if (!resolvedItem || !resolvedItem.data) {
      tags.current = undefined;
      notebooks.current = undefined;
      reminder.current = undefined;
      color.current = undefined;
      attachmentsCount.current = 0;
      totalNotes.current = 0;
      locked.current = false;
    }

    if (resolvedItem && resolvedItem.item) {
      const data = resolvedItem.data;
      if (resolvedItem.item.type === "note" && isNoteResolvedData(data)) {
        tags.current = data.tags;
        notebooks.current = data.notebooks;
        reminder.current = data.reminder;
        color.current = data.color;
        attachmentsCount.current = data.attachments?.total || 0;
        locked.current = data.locked || false;
      } else if (
        resolvedItem.item.type === "note" &&
        !isNoteResolvedData(data)
      ) {
        tags.current = undefined;
        notebooks.current = undefined;
        reminder.current = undefined;
        color.current = undefined;
        attachmentsCount.current = 0;
        totalNotes.current = 0;
        locked.current = false;
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
    }

    if (resolvedItem?.group) {
      setGroupHeader(resolvedItem.group);
    } else {
      setGroupHeader(undefined);
    }
  }, []);

  if (previousIndex.current !== index) {
    previousIndex.current = index;
    const resolvedItem = items?.cacheItem(index);
    if (resolvedItem) {
      refreshItem(resolvedItem);
    } else {
      setItem(undefined);
      setGroupHeader(undefined);
    }
  }

  useEffect(() => {
    (async function () {
      try {
        clearTimeout(refreshTimeout.current);
        const idx = index;
        refreshTimeout.current = setTimeout(
          async () => {
            if (idx !== previousIndex.current) return;
            const resolvedItem = await items?.item(idx, resolveItems);
            if (idx !== previousIndex.current) return;
            refreshItem(resolvedItem);
          },
          items?.cacheItem(index) ? 100 : 0
        );
      } catch (e) {}
    })();
  }, [index, items, refreshItem]);

  if (!item)
    return (
      <View
        style={{
          height: compactMode ? 50 : 120,
          width: "100%"
        }}
      />
    );

  const type = ((item as TrashItem).itemType || item.type) as ItemType;
  switch (type) {
    case "note": {
      return (
        <>
          {groupHeader && previousIndex.current === index && !isSheet ? (
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
            locked={locked.current}
          />
        </>
      );
    }
    case "notebook":
      return (
        <>
          {groupHeader && previousIndex.current === index && !isSheet ? (
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
          {groupHeader && previousIndex.current === index && !isSheet ? (
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
          {groupHeader && previousIndex.current === index && !isSheet ? (
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
            sortBy: "dateEdited",
            sortDirection: "desc"
          },
      item
    ) || 0
  );
}
