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

import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as attachmentStore } from "../stores/attachment-store";
import { store as reminderStore } from "../stores/reminder-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { TaskManager } from "./task-manager";
import { pluralize } from "@notesnook/common";
import { ConfirmDialog, showMultiDeleteConfirmation } from "../dialogs/confirm";

async function moveNotesToTrash(ids: string[], confirm = true) {
  if (confirm && !(await showMultiDeleteConfirmation(ids.length))) return;

  const vault = await db.vaults.default();
  if (vault) {
    const lockedIds = await db.relations.from(vault, "note").get();
    if (
      ids.some((id) => lockedIds.findIndex((s) => s.toId === id) > -1) &&
      !(await Vault.unlockVault())
    )
      return;
  }

  const items = ids.filter((id) => !db.monographs.isPublished(id));

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotes",
    title: "Deleting notes",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(items.length, "note")}...`
      });
      await noteStore.delete(...items);
    }
  });

  showToast("success", `${pluralize(items.length, "note")} moved to trash`);
}

async function moveNotebooksToTrash(ids: string[]) {
  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotebooks",
    title: "Deleting notebooks",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(ids.length, "notebook")}...`
      });
      await notebookStore.delete(...ids);
    }
  });

  showToast("success", `${pluralize(ids.length, "notebook")} moved to trash`);
}

async function deleteAttachments(ids: string[]) {
  if (
    !(await ConfirmDialog.show({
      title: "Are you sure?",
      message:
        "Are you sure you want to permanently delete these attachments? This action is IRREVERSIBLE.",
      negativeButtonText: "No",
      positiveButtonText: "Yes"
    }))
  )
    return;

  await TaskManager.startTask({
    type: "status",
    id: "deleteAttachments",
    title: "Deleting attachments",
    action: async (report) => {
      for (let i = 0; i < ids.length; ++i) {
        const id = ids[i];
        const attachment = await db.attachments.attachment(id);
        if (!attachment) continue;

        report({
          text: `Deleting ${pluralize(ids.length, "attachment")}...`,
          current: i,
          total: ids.length
        });
        await attachmentStore.permanentDelete(attachment);
      }
    }
  });
  showToast("success", `${pluralize(ids.length, "attachment")} deleted`);
}

async function moveRemindersToTrash(ids: string[]) {
  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteReminders",
    title: "Deleting reminders",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(ids.length, "reminder")}...`
      });
      await reminderStore.delete(...ids);
    }
  });

  showToast("success", `${pluralize(ids.length, "reminder")} deleted.`);
}

export const Multiselect = {
  moveRemindersToTrash,
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteAttachments
};
