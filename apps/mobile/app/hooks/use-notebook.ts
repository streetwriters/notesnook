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
import React, { useCallback, useEffect, useState } from "react";
import { db } from "../common/database";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { eOnNotebookUpdated } from "../utils/events";
import { useDBItem, useTotalNotes } from "./use-db-item";

export const useNotebook = (
  id?: string,
  items?: VirtualizedGrouping<Notebook>
) => {
  const [item, refresh] = useDBItem(id, "notebook", items);
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions("notebooks")
  );
  const [notebooks, setNotebooks] = useState<VirtualizedGrouping<Notebook>>();
  const { totalNotes: nestedNotebookNotesCount } = useTotalNotes(
    notebooks?.ids as string[],
    "notebook"
  );

  const onRequestUpdate = React.useCallback(() => {
    if (!item || !id) {
      if (notebooks) {
        setNotebooks(undefined);
      }
      return;
    }
    console.log("useNotebook.onRequestUpdate", id);
    db.relations
      .from(item, "notebook")
      .selector.sorted(db.settings.getGroupOptions("notebooks"))
      .then((notebooks) => {
        setNotebooks(notebooks);
      });
  }, [item, id, notebooks]);

  useEffect(() => {
    onRequestUpdate();
  }, [item, onRequestUpdate]);

  const onUpdate = useCallback(() => {
    setGroupOptions({ ...(db.settings.getGroupOptions("notebooks") as any) });
    onRequestUpdate();
  }, [onRequestUpdate]);

  useEffect(() => {
    const onNotebookUpdate = (id?: string) => {
      if (typeof id === "string" && id !== id) return;
      setImmediate(() => {
        onRequestUpdate();
        refresh();
      });
    };

    eSubscribeEvent("groupOptionsUpdate", onUpdate);
    eSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    return () => {
      eUnSubscribeEvent("groupOptionsUpdate", onUpdate);
      eUnSubscribeEvent(eOnNotebookUpdated, onNotebookUpdate);
    };
  }, [onUpdate, onRequestUpdate, id, refresh]);

  return {
    notebook: item,
    nestedNotebookNotesCount,
    nestedNotebooks: notebooks,
    onUpdate: onRequestUpdate,
    groupOptions
  };
};
