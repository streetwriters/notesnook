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
import TrashItem from "../trash-item";
import { db } from "../../common/db";
import Reminder from "../reminder";
import { Context } from "./types";
import { getSortValue } from "@notesnook/core/dist/utils/grouping";
import { GroupingKey, Item } from "@notesnook/core";
import { isNoteResolvedData } from "@notesnook/common";
import { Attachment } from "../attachment";

const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_LINE_HEIGHT =
  (document.getElementById("p")?.clientHeight || 16) - 1;
export const DEFAULT_ITEM_HEIGHT = SINGLE_LINE_HEIGHT * 4 * DEFAULT_LINE_HEIGHT;

type ListItemWrapperProps = {
  group?: GroupingKey;
  item: Item;
  data?: unknown;
  context?: Context;
  compact?: boolean;
  simplified?: boolean;
};

export function ListItemWrapper(props: ListItemWrapperProps) {
  const { group, compact, context, simplified, item, data } = props;

  switch (item.type) {
    case "note": {
      return (
        <Note
          compact={compact}
          item={item}
          date={getDate(item, group)}
          context={context}
          {...(isNoteResolvedData(data) ? data : {})}
        />
      );
    }
    case "notebook":
      return (
        <Notebook
          item={item}
          totalNotes={typeof data === "number" ? data : 0}
          date={getDate(item, group)}
          simplified={simplified}
        />
      );
    case "trash":
      return <TrashItem item={item} date={getDate(item, group)} />;
    case "reminder":
      return <Reminder item={item} simplified={simplified} />;
    case "tag":
      return (
        <Tag item={item} totalNotes={typeof data === "number" ? data : 0} />
      );
    case "attachment":
      return <Attachment item={item} compact={compact} />;
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
