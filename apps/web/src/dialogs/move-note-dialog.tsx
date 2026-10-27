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

import { useCallback } from "react";
import { db } from "../common/db";
import Dialog from "../components/dialog";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { showToast } from "../utils/toast";
import { isMac } from "../utils/platform";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import {
  RelationChange,
  useRelationChangesStore
} from "../stores/relation-changes-store";
import { NotebookPicker } from "../components/notebook-picker";

type MoveNoteDialogProps = BaseDialogProps<boolean> & { noteIds: string[] };

export const MoveNoteDialog = DialogManager.register(function MoveNoteDialog({
  onClose,
  noteIds
}: MoveNoteDialogProps) {
  const initialSelection = useCallback(async () => {
    const selected: RelationChange[] = [];
    for (const { fromId: notebookId } of await db.relations
      .to({ type: "note", ids: noteIds }, "notebook")
      .get()) {
      const isSelected =
        selected.findIndex((item) => item.id === notebookId) > -1;
      if (isSelected) continue;

      if (await notebookHasNotes(notebookId, noteIds)) {
        selected.push({
          id: notebookId,
          op: "add",
          new: false
        });
      }
    }
    return selected;
  }, [noteIds]);

  return (
    <Dialog
      testId="move-note-dialog"
      isOpen={true}
      title={strings.selectNotebooks()}
      description={strings.selectNotebooksDesktopDesc(isMac() ? "Cmd" : "Ctrl")}
      onClose={() => onClose(false)}
      width={700}
      noScroll
      sx={{ minHeight: "553px" }}
      positiveButton={{
        text: strings.done(),
        onClick: async () => {
          const { selected } = useRelationChangesStore.getState();
          for (const item of selected) {
            try {
              if (item.op === "remove") {
                await db.notes.removeFromNotebook(item.id, ...noteIds);
              } else if (item.op === "add") {
                await db.notes.addToNotebook(item.id, ...noteIds);
              }
            } catch (e) {
              if (e instanceof Error) showToast("error", e.message);
              console.error(e);
            }
          }

          await noteStore.refresh();
          await notebookStore.refresh();

          const added = selected.filter((a) => a.new && a.op === "add").length;
          const removed = selected.filter((a) => a.op === "remove").length;

          if (added > 0 || removed > 0) {
            showToast(
              "success",
              strings.assignedToNotebookMessage(noteIds.length, added, removed)
            );
          }

          onClose(true);
        }
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => onClose(false)
      }}
    >
      <NotebookPicker multiSelectable initialSelection={initialSelection} />
    </Dialog>
  );
});

function notebookHasNotes(notebookId: string, noteIds: string[]) {
  return db.relations
    .from({ type: "notebook", id: notebookId }, "note")
    .has(...noteIds);
}
