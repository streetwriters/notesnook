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
  HistorySession,
  Note,
  Notebook,
  Reminder,
  Shortcut,
  Tag,
  VirtualizedGrouping
} from "@notesnook/core";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../common/database";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { useSettingStore } from "../stores/use-setting-store";
import { eDBItemUpdate } from "../utils/events";

type ItemTypeKey = {
  note: Note;
  notebook: Notebook;
  tag: Tag;
  color: Color;
  reminder: Reminder;
  attachment: Attachment;
  shortcut: Shortcut;
  noteHistory: HistorySession;
};

function isValidIdOrIndex(idOrIndex?: string | number) {
  return typeof idOrIndex === "number" || typeof idOrIndex === "string";
}

export const useDBItem = <T extends keyof ItemTypeKey>(
  idOrIndex?: string | number,
  type?: T,
  items?: VirtualizedGrouping<ItemTypeKey[T]>,
  onItemUpdated?: (item?: ItemTypeKey[T]) => void
): [ItemTypeKey[T] | undefined, () => void] => {
  const [item, setItem] = useState<ItemTypeKey[T]>();
  const itemIdRef = useRef<string>();
  const prevIdOrIndexRef = useRef<string | number>();

  if (prevIdOrIndexRef.current !== idOrIndex) {
    itemIdRef.current = undefined;
    prevIdOrIndexRef.current = idOrIndex;
  }

  useEffect(() => {
    const onUpdateItem = async (itemId?: string) => {
      if (typeof itemId === "string" && itemId !== itemIdRef.current) return;
      if (!isValidIdOrIndex(idOrIndex)) return;

      if (items && typeof idOrIndex === "number") {
        const item = (await items.item(idOrIndex))?.item;
        setItem(item);
        itemIdRef.current = item?.id;
        onItemUpdated?.(item);
      } else {
        if (!(db as any)[type + "s"][type]) {
          console.warn(
            "no method found for",
            `db.${type}s.${type}(id: string)`
          );
        } else {
          const item = await (db as any)[type + "s"]?.[type]?.(
            idOrIndex as string
          );
          setItem(item);
          itemIdRef.current = item.id;
          onItemUpdated?.(item);
        }
      }
    };

    if (
      useSettingStore.getState().isAppLoading &&
      //@ts-ignore
      !globalThis["IS_SHARE_EXTENSION"]
    ) {
      useSettingStore.subscribe((state) => {
        if (!state.isAppLoading) {
          onUpdateItem();
        }
      });
    } else {
      onUpdateItem();
    }
    eSubscribeEvent(eDBItemUpdate, onUpdateItem);
    return () => {
      eUnSubscribeEvent(eDBItemUpdate, onUpdateItem);
    };
  }, [idOrIndex, type, items, onItemUpdated]);

  return [
    isValidIdOrIndex(idOrIndex) ? (item as ItemTypeKey[T]) : undefined,
    () => {
      if (idOrIndex) {
        eSendEvent(eDBItemUpdate, itemIdRef.current || idOrIndex);
      }
    }
  ];
};

export const useNoteLocked = (noteId: string | undefined) => {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!noteId) return;

    if (
      useSettingStore.getState().isAppLoading &&
      //@ts-ignore
      !globalThis["IS_SHARE_EXTENSION"]
    ) {
      useSettingStore.subscribe((state) => {
        if (!state.isAppLoading) {
          db.vaults
            .itemExists({
              type: "note",
              id: noteId
            })
            .then((exists) => {
              setLocked(exists);
            });
        }
      });
    } else {
      db.vaults
        .itemExists({
          type: "note",
          id: noteId
        })
        .then((exists) => {
          setLocked(exists);
        });
    }

    const sub = eSubscribeEvent(eDBItemUpdate, (id: string) => {
      if (id === noteId) {
        db.vaults
          .itemExists({
            type: "note",
            id: noteId
          })
          .then((exists) => {
            setLocked(exists);
          });
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [noteId]);

  return locked;
};

export const useTotalNotes = (type: "notebook" | "tag" | "color") => {
  const [totalNotesById, setTotalNotesById] = useState<{
    [id: string]: number;
  }>({});

  const getTotalNotes = React.useCallback(
    (ids: string[]) => {
      if (!ids || !ids.length || !type) return;
      db.relations
        .from({ type: type, ids: ids as string[] }, ["note"])
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
    },
    [type]
  );

  return {
    totalNotes: (id: string) => {
      return totalNotesById[id] || 0;
    },
    getTotalNotes: getTotalNotes
  };
};
