import { showMultiDeleteConfirmation } from "./dialog-controller";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as attachmentStore } from "../stores/attachment-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { showItemDeletedToast } from "./toasts";
import { TaskManager } from "./task-manager";

async function moveNotesToTrash(notes: any[]) {
  const item = notes[0];
  if (!(await showMultiDeleteConfirmation(notes.length))) return;

  if (notes.length === 1) {
    if (
      item.locked &&
      !(await Vault.unlockNote(item.id, "unlock_and_delete_note"))
    )
      return;
    item.locked = false;
  }

  const items = notes.map((item) => {
    if (item.locked || db.monographs!.isPublished(item.id)) return 0;
    return item.id;
  });

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotes",
    action: async (report) => {
      report({
        text: `Deleting ${items.length} notes...`,
      });
      await noteStore.delete(...items);
    },
  });

  showToast("success", `${items.length} notes moved to trash`);
}

async function moveNotebooksToTrash(notebooks: any[]) {
  const item = notebooks[0];
  const isMultiselect = notebooks.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(notebooks.length))) return;
  } else {
    if (item.locked && !(await Vault.unlockNote(item.id))) return;
  }

  await TaskManager.startTask({
    type: "status",
    id: "deleteNotebooks",
    action: async (report) => {
      report({
        text: `Deleting ${notebooks.length} notebooks...`,
      });
      await notebookStore.delete(...notebooks.map((i) => i.id));
    },
  });

  if (isMultiselect) {
    showToast("success", `${notebooks.length} notebooks moved to trash`);
  } else {
    showItemDeletedToast(item);
  }
}

async function deleteTopics(notebookId: string, topics: any[]) {
  await TaskManager.startTask({
    type: "status",
    id: "deleteTopics",
    action: async (report) => {
      report({
        text: `Deleting ${topics.length} topics...`,
      });
      await db
        .notebooks!.notebook(notebookId)
        .topics.delete(...topics.map((t) => t.id));
      notebookStore.setSelectedNotebook(notebookId);
    },
  });
  showToast("success", `${topics.length} topics deleted`);
}

async function deleteAttachments(attachments: any[]) {
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
          text: `Deleting ${attachments.length} attachments...`,
          current: i,
          total: attachments.length,
        });
        console.log(attachment);
        await attachmentStore.permanentDelete(attachment.metadata.hash);
      }
    },
  });
  showToast("success", `${attachments.length} attachments deleted`);
}

export const Multiselect = {
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteTopics,
  deleteAttachments,
};
