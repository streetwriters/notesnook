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

import { Notebook } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useCallback, useEffect } from "react";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { store as notebookStore, useStore } from "../stores/notebook-store";
import { useSelectionStore } from "../stores/relation-changes-store";
import { NotebookPicker } from "../components/notebook-picker";

type MoveNotebookDialogProps = BaseDialogProps<boolean> & {
  notebook: Notebook;
};

export const MoveNotebookDialog = DialogManager.register(
  function MoveNotebookDialog({ onClose, notebook }: MoveNotebookDialogProps) {
    const setSelected = useSelectionStore((store) => store.setSelected);
    const refreshNotebooks = useStore((store) => store.refresh);
    const notebookId = notebook.id;

    useEffect(() => {
      (async function () {
        const parentNotebookId = await db.notebooks.parentId(notebookId);
        const selected = useSelectionStore.getState().selected[0];
        if (!selected && parentNotebookId) {
          setSelected([{ id: parentNotebookId, new: false, op: "add" }]);
        }
      })();
    }, [notebookId, refreshNotebooks, setSelected]);

    const _onClose = useCallback(
      (result: boolean) => {
        setSelected([]);
        onClose(result);
      },
      [setSelected, onClose]
    );

    return (
      <Dialog
        testId="move-notebook-dialog"
        isOpen={true}
        title={`${strings.move()} ${notebook.title}`}
        description={strings.moveNotebookDesc()}
        onClose={() => _onClose(false)}
        width={700}
        noScroll
        sx={{ minHeight: "553px" }}
        positiveButton={{
          text: strings.done(),
          onClick: async () => {
            const { selected } = useSelectionStore.getState();
            for (const item of selected) {
              if (item.op === "remove") {
                await db.relations.unlink(
                  { type: "notebook", id: item.id },
                  { id: notebookId, type: "notebook" }
                );
              } else if (item.op === "add") {
                await db.relations.add(
                  { type: "notebook", id: item.id },
                  { id: notebookId, type: "notebook" }
                );
              }
            }
            await notebookStore.refresh();
            _onClose(true);
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => _onClose(false)
        }}
      >
        <NotebookPicker excludeId={notebookId} />
      </Dialog>
    );
  }
);
