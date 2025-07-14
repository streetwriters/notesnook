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
import { store as trashStore } from "../stores/trash-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as attachmentStore } from "../stores/attachment-store";
import { store as reminderStore } from "../stores/reminder-store";
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { TaskManager } from "./task-manager";
import {
  ConfirmDialog,
  showMultiDeleteConfirmation,
  showMultiPermanentDeleteConfirmation
} from "../dialogs/confirm";
import { strings } from "@notesnook/intl";
import { isFeatureAvailable } from "@notesnook/common";
import { showFeatureNotAllowedToast } from "./toasts";

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
    title: strings.inProgressActions.deleting.note(items.length),
    action: async (report) => {
      report({
        text: strings.inProgressActions.deleting.note(items.length)
      });
      await noteStore.delete(...items);
    }
  });

  showToast("success", strings.actions.movedToTrash.note(items.length));
}

async function moveNotebooksToTrash(ids: string[]) {
  if (!ids.length) return;

  const result = await ConfirmDialog.show({
    title: strings.doActions.delete.notebook(ids.length),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no(),
    checks: {
      deleteContainingNotes: {
        text: strings.deleteContainingNotes(ids.length)
      }
    }
  });

  if (!result) return;

  if (result.deleteContainingNotes) {
    await Multiselect.moveNotesToTrash(await db.notebooks.notes(...ids), false);
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotebooks",
    title: strings.inProgressActions.deleting.notebook(ids.length),
    action: async (report) => {
      report({
        text: strings.inProgressActions.deleting.notebook(ids.length)
      });
      await notebookStore.delete(...ids);
    }
  });

  showToast("success", strings.actions.movedToTrash.notebook(ids.length));
}

async function deleteAttachments(ids: string[]) {
  if (
    !(await ConfirmDialog.show({
      title: strings.doActions.permanentlyDelete.attachment(ids.length),
      message: strings.irreverisibleAction(),
      negativeButtonText: strings.no(),
      positiveButtonText: strings.yes()
    }))
  )
    return;

  await TaskManager.startTask({
    type: "status",
    id: "deleteAttachments",
    title: strings.inProgressActions.deleting.attachment(ids.length),
    action: async (report) => {
      for (let i = 0; i < ids.length; ++i) {
        const id = ids[i];
        const attachment = await db.attachments.attachment(id);
        if (!attachment) continue;

        report({
          text: strings.inProgressActions.deleting.attachment(ids.length),
          current: i,
          total: ids.length
        });
        await attachmentStore.permanentDelete(attachment);
      }
    }
  });
  showToast("success", strings.actions.deleted.attachment(ids.length));
}

async function moveRemindersToTrash(ids: string[]) {
  const isMultiselect = ids.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(ids.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteReminders",
    title: strings.inProgressActions.deleting.reminder(ids.length),
    action: async (report) => {
      report({
        text: strings.inProgressActions.deleting.reminder(ids.length)
      });
      await reminderStore.delete(...ids);
    }
  });

  showToast("success", strings.actions.deleted.reminder(ids.length));
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
        text: strings.inProgressActions.deleting.tag(ids.length)
      });
      for (const id of ids) {
        await db.tags.remove(id);
      }
      await appStore.refreshNavItems();
      await tagStore.refresh();
      await noteStore.refresh();
    }
  });

  showToast("success", strings.actions.deleted.tag(ids.length));
}

async function restoreItemsFromTrash(ids: string[]) {
  if (!ids.length) return;

  const notebookIds = ids.filter((id) => db.trash.cache.notebooks.includes(id));
  const result = await isFeatureAvailable(
    "notebooks",
    (await db.notebooks.all.count()) + notebookIds.length
  );
  if (!result.isAllowed) return showFeatureNotAllowedToast(result);

  await TaskManager.startTask({
    type: "status",
    id: "restoreItems",
    title: strings.inProgressActions.restoring.item(ids.length),
    action: async (report) => {
      report({
        text: strings.inProgressActions.restoring.item(ids.length)
      });
      await trashStore.restore(...ids);
    }
  });

  showToast("success", strings.actions.restored.item(ids.length));
}

async function deleteItemsFromTrash(ids: string[]) {
  if (!ids.length) return;

  if (!(await showMultiPermanentDeleteConfirmation(ids.length))) return;

  await TaskManager.startTask({
    type: "status",
    id: "restoreItems",
    title: strings.inProgressActions.permanentlyDeleting.item(ids.length),
    action: async (report) => {
      report({
        text: strings.inProgressActions.permanentlyDeleting.item(ids.length)
      });
      await trashStore.delete(...ids);
    }
  });

  showToast("success", strings.actions.permanentlyDeleted.item(ids.length));
}

export const Multiselect = {
  moveRemindersToTrash,
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteAttachments,
  deleteTags,
  restoreItemsFromTrash,
  deleteItemsFromTrash
};
