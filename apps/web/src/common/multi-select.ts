import { removeStatus, updateStatus } from "../hooks/use-status";
import {
  showMultiDeleteConfirmation,
  showMultiPermanentDeleteConfirmation,
} from "./dialog-controller";
import { store as editorStore } from "../stores/editor-store";
import { store as appStore } from "../stores/app-store";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { db } from "./db";
import { hashNavigate } from "../navigation";
import { showToast } from "../utils/toast";
import Vault from "./vault";
import { showItemDeletedToast } from "./toasts";
import { TaskManager } from "./task-manager";

async function moveNotesToTrash(notes: any[]) {
  const item = notes[0];
  const isMultiselect = notes.length > 1;
  if (isMultiselect) {
    if (!(await showMultiDeleteConfirmation(notes.length))) return;
  } else {
    if (item.locked && !(await Vault.unlockNote(item.id))) return;
  }

  var isAnyNoteOpened = false;
  const items = notes.map((item) => {
    if (item.id === editorStore.get().session.id) isAnyNoteOpened = true;
    if (item.locked || db.monographs.isPublished(item.id)) return 0;
    return item.id;
  });

  if (isAnyNoteOpened) {
    hashNavigate("/notes/create", { addNonce: true });
  }

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

  if (isMultiselect) {
    showToast("success", `${items.length} notes moved to trash`);
  } else {
    showItemDeletedToast(item);
  }
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
      await db.notebooks
        .notebook(notebookId)
        .topics.delete(...topics.map((t) => t.id));
      notebookStore.setSelectedNotebook(notebookId);
    },
  });
  showToast("success", `${topics.length} topics deleted`);
}

export const Multiselect = {
  moveNotebooksToTrash,
  moveNotesToTrash,
  deleteTopics,
};
