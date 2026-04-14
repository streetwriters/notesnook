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
  const itemIdRef = useRef<string>(undefined);
  const itemsRef = useRef(item);
  itemsRef.current = item;

  useEffect(() => {
    const onUpdateItem = async (itemId?: string) => {
      if (typeof itemId === "string" && itemId !== itemIdRef.current) return;
      if (!isValidIdOrIndex(idOrIndex)) return;

      let item: ItemTypeKey[T] | undefined = undefined;
      if (items && typeof idOrIndex === "number") {
        item = (await items.item(idOrIndex))?.item;
      } else {
        if (!(db as any)[type + "s"][type]) {
          console.warn(
            "no method found for",
            `db.${type}s.${type}(id: string)`
          );
        } else {
          item = await (db as any)[type + "s"]?.[type]?.(idOrIndex as string);
        }
      }

      if (
        itemsRef.current === item ||
        itemsRef.current?.dateModified === item?.dateModified
      )
        return;
      setItem(item);
      itemIdRef.current = item?.id;
      onItemUpdated?.(item);
    };
    let unsub: (() => void) | undefined;
    if (
      useSettingStore.getState().isAppLoading &&
      //@ts-ignore
      !globalThis["IS_SHARE_EXTENSION"]
    ) {
      unsub = useSettingStore.subscribe((state) => {
        if (!state.isAppLoading) {
          onUpdateItem();
          unsub?.();
          unsub = undefined;
        }
      });
    } else {
      onUpdateItem();
    }
    eSubscribeEvent(eDBItemUpdate, onUpdateItem);
    return () => {
      unsub?.();
      eUnSubscribeEvent(eDBItemUpdate, onUpdateItem);
    };
  }, [idOrIndex, type, items]);

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
      const unsub = useSettingStore.subscribe((state) => {
        if (!state.isAppLoading) {
          unsub();
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
  const totalNotesRef = useRef(0);

  const getTotalNotes = React.useCallback((ids: string[]) => {
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

        if (totalNotesById === totalNotesRef.current) return;
        totalNotesRef.current = totalNotesById;
        setTotalNotesById(totalNotesById);
      });
  }, []);

  return {
    totalNotes: (id: string) => {
      return totalNotesById[id] || 0;
    },
    getTotalNotes: getTotalNotes
  };
};
