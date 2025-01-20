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
import React, { useEffect, useState } from "react";
import { db } from "../common/database";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { eGroupOptionsUpdated, eOnNotebookUpdated } from "../utils/events";
import { useDBItem, useTotalNotes } from "./use-db-item";

export const useNotebook = (
  id?: string | number,
  items?: VirtualizedGrouping<Notebook>,
  nestedNotebooks?: boolean
) => {
  const [item, refresh] = useDBItem(id, "notebook", items);
  const groupOptions = db.settings.getGroupOptions("notebooks");
  const [notebooks, setNotebooks] = useState<VirtualizedGrouping<Notebook>>();
  const { totalNotes: nestedNotebookNotesCount, getTotalNotes } =
    useTotalNotes("notebook");

  const onRequestUpdate = React.useCallback(() => {
    if (!item?.id) return;

    const selector = db.relations.from(
      {
        type: "notebook",
        id: item.id
      },
      "notebook"
    ).selector;

    selector.ids().then((notebookIds) => {
      getTotalNotes(notebookIds);
    });

    selector
      .sorted(db.settings.getGroupOptions("notebooks"))
      .then((notebooks) => {
        setNotebooks(notebooks);
      });
  }, [getTotalNotes, item?.id]);

  useEffect(() => {
    if (nestedNotebooks) {
      onRequestUpdate();
    }
  }, [item?.id, onRequestUpdate, nestedNotebooks]);

  useEffect(() => {
    const onNotebookUpdate = (id?: string) => {
      if (typeof id === "string" && id !== id) return;
      setImmediate(() => {
        if (nestedNotebooks) {
          onRequestUpdate();
        }
        refresh();
      });
    };

    const onUpdate = (type: string) => {
      if (type !== "notebooks") return;
      onRequestUpdate();
    };

    eSubscribeEvent(eGroupOptionsUpdated, onUpdate);
    eSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    return () => {
      eUnSubscribeEvent(eGroupOptionsUpdated, onUpdate);
      eUnSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    };
  }, [onRequestUpdate, item?.id, refresh, nestedNotebooks]);

  return {
    notebook: item,
    nestedNotebookNotesCount,
    nestedNotebooks: item ? notebooks : undefined,
    onUpdate: onRequestUpdate,
    groupOptions
  };
};
