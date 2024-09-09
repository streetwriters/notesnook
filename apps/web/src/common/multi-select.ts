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
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { TaskManager } from "./task-manager";
import { pluralize } from "@notesnook/common";
import { ConfirmDialog, showMultiDeleteConfirmation } from "../dialogs/confirm";
import { strings } from "@notesnook/intl";

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
    title: strings.deletingItems("note", items.length),
    action: async (report) => {
      report({
        text: `${strings.deleting()} ${strings.notes(items.length)}...`
      });
      await noteStore.delete(...items);
    }
  });

  showToast("success", strings.movedToTrash("note", items.length));
}

async function moveNotebooksToTrash(ids: string[]) {
  if (!ids.length) return;

  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotebooks",
    title: strings.deletingItems("notebook", ids.length),
    action: async (report) => {
      report({
        text: `${strings.deleting()} ${strings.itemsPlural(
          "notebook",
          ids.length
        )}...`
      });
      await notebookStore.delete(...ids);
    }
  });

  showToast("success", strings.movedToTrash("notebook", ids.length));
}

async function deleteAttachments(ids: string[]) {
  if (
    !(await ConfirmDialog.show({
      title: strings.doAction("attachment", ids.length, "permanentlyDelete"),
      message: strings.permanentlyDeleteDesc("attachment", ids.length),
      negativeButtonText: "No",
      positiveButtonText: "Yes"
    }))
  )
    return;

  await TaskManager.startTask({
    type: "status",
    id: "deleteAttachments",
    title: strings.deletingItems("attachment", ids.length),
    action: async (report) => {
      for (let i = 0; i < ids.length; ++i) {
        const id = ids[i];
        const attachment = await db.attachments.attachment(id);
        if (!attachment) continue;

        report({
          text: `${strings.deleting()} ${strings.itemsPlural(
            "attachment",
            ids.length
          )}...`,
          current: i,
          total: ids.length
        });
        await attachmentStore.permanentDelete(attachment);
      }
    }
  });
  showToast("success", strings.deleted("attachment", ids.length));
}

async function moveRemindersToTrash(ids: string[]) {
  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteReminders",
    title: strings.deletingItems("reminder", ids.length),
    action: async (report) => {
      report({
        text: `${strings.deleting()} ${strings.itemsPlural(
          "reminder",
          ids.length
        )}...`
      });
      await reminderStore.delete(...ids);
    }
  });

  showToast("success", strings.deleted("reminder", ids.length));
}

async function deleteTags(ids: string[]) {
  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteTags",
    title: "Deleting tags",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(ids.length, "tag")}...`
      });
      for (const id of ids) {
        await db.tags.remove(id);
      }
      await appStore.refreshNavItems();
      await tagStore.refresh();
      await noteStore.refresh();
    }
  });

  showToast("success", `${pluralize(ids.length, "tag")} deleted.`);
}

export const Multiselect = {
  moveRemindersToTrash,
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteAttachments,
  deleteTags
};
