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

import type { GroupingKey, Item } from "@notesnook/core";
import { getSortValue } from "@notesnook/core";
import { isNoteResolvedData } from "@notesnook/common";
import { db } from "../../common/db";
import Note from "../note";
import Tag from "../tag";
import TrashItem from "../trash-item";
import Reminder from "../reminder";
import { Attachment } from "../attachment";
import { Notebook } from "../notebook";
import SearchResult from "../search-result";
import type { Context } from "./types";

type ListItemWrapperProps = {
  group?: GroupingKey;
  item: Item;
  data?: unknown;
  context?: Context;
  compact?: boolean;
  index?: number;
};

export function ListItemWrapper(props: ListItemWrapperProps) {
  const { group, compact, context, item, data, index } = props;

  switch (item.type) {
    case "note":
      return (
        <Note
          index={index}
          compact={compact}
          item={item}
          date={getDate(item, group)}
          context={context}
          {...(isNoteResolvedData(data) ? data : {})}
        />
      );
    case "searchResult":
      return <SearchResult item={item} />;
    case "trash":
      return (
        <TrashItem index={index} item={item} date={getDate(item, group)} />
      );
    case "notebook":
      return (
        <Notebook
          index={index}
          item={item}
          totalNotes={typeof data === "number" ? data : 0}
        />
      );
    case "reminder":
      return <Reminder index={index} item={item} compact={compact} />;
    case "tag":
      return (
        <Tag
          index={index}
          item={item}
          totalNotes={typeof data === "number" ? data : 0}
        />
      );
    case "attachment":
      return <Attachment item={item} compact={compact} />;
    default:
      return null;
  }
}

type PlaceholderData = {
  padding: [number, number, number, number];
  lines: { height: number; width: "random" | string | number }[];
  gap?: number;
};

const COMPACT_PLACEHOLDER_ITEM_DATA: PlaceholderData = {
  padding: [6, 5, 6, 5],
  lines: [{ height: 16, width: "random" }]
};
const FULL_PLACEHOLDER_ITEM_DATA: PlaceholderData = {
  padding: [10, 5, 10, 5],
  gap: 5,
  lines: [
    { height: 16, width: "50%" },
    { height: 12, width: "100%" },
    { height: 12, width: "70%" },
    { height: 10, width: 30 }
  ]
};

export function getListItemDefaultHeight(
  group: GroupingKey | undefined,
  compact: boolean | undefined
) {
  const data = getListItemPlaceholderData(group, compact);
  let height = data.padding[0] + data.padding[2];
  if (data.gap) height += data.gap * data.lines.length - 1;
  data.lines.forEach((line) => (height += line.height));
  return height;
}

export function getListItemPlaceholderData(
  group: GroupingKey | undefined,
  compact: boolean | undefined
): PlaceholderData {
  switch (group) {
    case "home":
    case "favorites":
    case "notes":
    case "notebooks":
    case "trash":
    case "reminders":
      if (compact) return COMPACT_PLACEHOLDER_ITEM_DATA;
      return FULL_PLACEHOLDER_ITEM_DATA;
    case "tags":
    default:
      return COMPACT_PLACEHOLDER_ITEM_DATA;
  }
}

function getDate(item: Item, groupType?: GroupingKey): number {
  return (
    getSortValue(
      groupType
        ? db.settings.getGroupOptions(groupType)
        : { sortBy: "dateEdited", sortDirection: "desc" },
      item as Parameters<typeof getSortValue>[1]
    ) || 0
  );
}
