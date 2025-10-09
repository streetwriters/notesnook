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
import { Notebook, VirtualizedGrouping } from "@notesnook/core";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../common/database";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { eGroupOptionsUpdated, eOnNotebookUpdated } from "../utils/events";
import { useDBItem, useTotalNotes } from "./use-db-item";

export const useNotebook = (
  id?: string | number,
  items?: VirtualizedGrouping<Notebook>,
  nestedNotebooks?: boolean,
  countNotes?: boolean
) => {
  const groupOptions = db.settings.getGroupOptions("notebooks");
  const [notebooks, setNotebooks] = useState<VirtualizedGrouping<Notebook>>();
  const { totalNotes: nestedNotebookNotesCount, getTotalNotes } =
    useTotalNotes("notebook");
  const getTotalNotesRef = useRef(getTotalNotes);
  getTotalNotesRef.current = getTotalNotes;
  const onItemUpdated = React.useCallback(
    (item?: Notebook) => {
      if (!item) return;

      if (nestedNotebooks) {
        const selector = db.relations.from(
          {
            type: "notebook",
            id: item.id
          },
          "notebook"
        ).selector;
        selector.ids().then((notebookIds) => {
          getTotalNotesRef.current(notebookIds);
        });

        selector
          .sorted(db.settings.getGroupOptions("notebooks"))
          .then((notebooks) => {
            setNotebooks(notebooks);
          });
      }

      if (countNotes) {
        getTotalNotesRef.current([item?.id]);
      }
    },
    [countNotes, nestedNotebooks]
  );

  const [item, refresh] = useDBItem(id, "notebook", items, onItemUpdated);

  const itemRef = useRef(item);
  itemRef.current = item;
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const onNotebookUpdate = (id?: string) => {
      if (typeof id === "string" && id !== id) return;
      refreshRef.current();
    };

    const onUpdate = (type: string) => {
      if (type !== "notebooks") return;
      refreshRef.current();
    };

    eSubscribeEvent(eGroupOptionsUpdated, onUpdate);
    eSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    return () => {
      eUnSubscribeEvent(eGroupOptionsUpdated, onUpdate);
      eUnSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    };
  }, [nestedNotebooks]);

  return {
    notebook: item,
    nestedNotebookNotesCount,
    nestedNotebooks: item ? notebooks : undefined,
    onUpdate: () => refresh(),
    groupOptions,
    notesCount: !item ? 0 : nestedNotebookNotesCount(item?.id)
  };
};
