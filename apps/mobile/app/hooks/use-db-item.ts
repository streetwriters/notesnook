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
  Attachment,
  Color,
  Note,
  Notebook,
  Reminder,
  Shortcut,
  Tag,
  VirtualizedGrouping
} from "@notesnook/core";
import React, { useEffect, useState } from "react";
import { db } from "../common/database";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { eDBItemUpdate } from "../utils/events";

type ItemTypeKey = {
  note: Note;
  notebook: Notebook;
  tag: Tag;
  color: Color;
  reminder: Reminder;
  attachment: Attachment;
  shortcut: Shortcut;
};

export const useDBItem = <T extends keyof ItemTypeKey>(
  id?: string,
  type?: T,
  items?: VirtualizedGrouping<ItemTypeKey[T]>
): [ItemTypeKey[T] | undefined, () => void] => {
  const [item, setItem] = useState<ItemTypeKey[T]>();

  useEffect(() => {
    const onUpdateItem = (itemId?: string) => {
      if (typeof itemId === "string" && itemId !== id) return;
      if (!id) return;
      console.log("useDBItem.onUpdateItem", id, type);

      if (items) {
        items.item(id).then((item) => {
          setItem(item);
        });
      } else {
        if (!(db as any)[type + "s"][type]) {
          console.warn(
            "no method found for",
            `db.${type}s.${type}(id: string)`
          );
        } else {
          (db as any)[type + "s"]
            ?.[type]?.(id)
            .then((item: ItemTypeKey[T]) => setItem(item));
        }
      }
    };
    onUpdateItem();
    eSubscribeEvent(eDBItemUpdate, onUpdateItem);
    return () => {
      eUnSubscribeEvent(eDBItemUpdate, onUpdateItem);
    };
  }, [id, type, items]);

  return [
    id ? (item as ItemTypeKey[T]) : undefined,
    () => {
      if (id) {
        eSendEvent(eDBItemUpdate, id);
      }
    }
  ];
};

export const useTotalNotes = (
  ids: string[],
  type: "notebook" | "tag" | "color"
) => {
  const [totalNotesById, setTotalNotesById] = useState<{
    [id: string]: number;
  }>({});

  const getTotalNotes = React.useCallback(() => {
    if (!ids || !ids.length || !type) return;
    db.relations
      .from({ type: "notebook", ids: ids as string[] }, ["notebook", "note"])
      .get()
      .then((relations) => {
        const totalNotesById: any = {};
        for (const id of ids) {
          totalNotesById[id] = relations.filter(
            (relation) => relation.fromId === id && relation.toType === "note"
          )?.length;
        }
        setTotalNotesById(totalNotesById);
      });
    console.log("useTotalNotes.getTotalNotes");
  }, [ids, type]);

  useEffect(() => {
    getTotalNotes();
  }, [ids, type, getTotalNotes]);

  return {
    totalNotes: (id: string) => {
      return totalNotesById[id] || 0;
    },
    getTotalNotes: getTotalNotes
  };
};
