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

import { showMultiDeleteConfirmation } from "./dialog-controller";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as attachmentStore } from "../stores/attachment-store";
import { store as reminderStore } from "../stores/reminder-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { TaskManager } from "./task-manager";
import { pluralize } from "@notesnook/common";

type Item = {
  id: string;
  locked?: boolean;
  metadata?: Record<string, unknown>;
};

async function moveNotesToTrash(notes: Item[], confirm = true) {
  const item = notes[0];
  if (confirm && !(await showMultiDeleteConfirmation(notes.length))) return;

  if (notes.length === 1) {
    if (
      item.locked &&
      !(await Vault.unlockNote(item.id, "unlock_and_delete_note"))
    )
      return;
    item.locked = false;
  }

  const items = notes.map((item) => {
    if (item.locked || db.monographs.isPublished(item.id)) return 0;
    return item.id;
  });

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotes",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(items.length, "note")}...`
      });
      await noteStore.delete(...items);
    }
  });

  showToast("success", `${pluralize(items.length, "note")} moved to trash`);
}

async function moveNotebooksToTrash(notebooks: Item[]) {
  const isMultiselect = notebooks.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(notebooks.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotebooks",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(notebooks.length, "notebook")}...`
      });
      await notebookStore.delete(...notebooks.map((i) => i.id));
    }
  });

  showToast(
    "success",
    `${pluralize(notebooks.length, "notebook")} moved to trash`
  );
}

async function deleteTopics(notebookId: string, topics: Item[]) {
  await TaskManager.startTask({
    type: "status",
    id: "deleteTopics",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(topics.length, "topic")}...`
      });
      await db.notebooks.topics(notebookId).delete(...topics.map((t) => t.id));
      notebookStore.setSelectedNotebook(notebookId);
      noteStore.refresh();
    }
  });
  showToast("success", `${pluralize(topics.length, "topic")} deleted`);
}

async function deleteAttachments(attachments: Item[]) {
  if (
    !window.confirm(
      "Are you sure you want to permanently delete these attachments? This action is IRREVERSIBLE."
    )
  )
    return;

  await TaskManager.startTask({
    type: "status",
    id: "deleteAttachments",
    action: async (report) => {
      for (let i = 0; i < attachments.length; ++i) {
        const attachment = attachments[i];
        report({
          text: `Deleting ${pluralize(attachments.length, "attachment")}...`,
          current: i,
          total: attachments.length
        });
        await attachmentStore.permanentDelete(attachment.metadata?.hash);
      }
    }
  });
  showToast(
    "success",
    `${pluralize(attachments.length, "attachment")} deleted`
  );
}

async function moveRemindersToTrash(reminders: Item[]) {
  const isMultiselect = reminders.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(reminders.length))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteReminders",
    action: async (report) => {
      report({
        text: `Deleting ${pluralize(reminders.length, "reminder")}...`
      });
      await reminderStore.delete(...reminders.map((i) => i.id));
    }
  });

  showToast("success", `${pluralize(reminders.length, "reminder")} deleted.`);
}

export const Multiselect = {
  moveRemindersToTrash,
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteTopics,
  deleteAttachments
};
