import * as Icon from "../components/icons";
import { store as selectionStore } from "../stores/selection-store";
import { store as notesStore } from "../stores/note-store";
import { store as nbStore } from "../stores/notebook-store";
import { store as editorStore } from "../stores/editor-store";
import { store as appStore } from "../stores/app-store";
import { store as trashStore } from "../stores/trash-store";
import { db } from "./db";
import { showMoveNoteDialog } from "../common/dialog-controller";
import {
  showMultiDeleteConfirmation,
  showMultiPermanentDeleteConfirmation,
} from "../common/dialog-controller";
import { showExportDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";
import { hashNavigate } from "../navigation";

function createOption(key, title, icon, onClick) {
  return {
    key,
    icon,
    title,
    onClick: async () => {
      await onClick.call(this, selectionStore.get());
      selectionStore.toggleSelectionMode(false);
      appStore.setProcessingStatus(key);
    },
  };
}

function createOptions(options = []) {
  return [...options, DeleteOption];
}

const DeleteOption = createOption(
  "deleteOption",
  "Delete",
  Icon.Trash,
  async function (state) {
    const item = state.selectedItems[0];

    const confirmDialog = item.dateDeleted
      ? showMultiPermanentDeleteConfirmation
      : showMultiDeleteConfirmation;
    if (!(await confirmDialog(state.selectedItems.length))) return;

    const statusText = `${
      item.dateDeleted ? `Permanently deleting` : `Deleting`
    } ${state.selectedItems.length} items...`;
    appStore.setProcessingStatus("deleteOption", statusText);

    var isAnyNoteOpened = false;
    const items = state.selectedItems.map((item) => {
      if (item.id === editorStore.get().session.id) isAnyNoteOpened = true;
      if (item.locked || db.monographs.isPublished(item.id)) return 0;
      return item.id;
    });

    if (item.dateDeleted) {
      // we are in trash
      await db.trash.delete(...items);
      trashStore.refresh();
      showToast("success", `${items.length} items permanently deleted!`);
      return;
    }

    if (isAnyNoteOpened) {
      hashNavigate("/notes/create", { addNonce: true });
    }

    if (item.type === "note") {
      await db.notes.delete(...items);
    } else if (item.type === "notebook") {
      await db.notebooks.delete(...items);
    } else if (item.type === "topic") {
      await db.notebooks.notebook(item.notebookId).topics.delete(...items);
      nbStore.setSelectedNotebook(item.notebookId);
    }
    appStore.refresh();
    showToast("success", `${items.length} ${item.type}s moved to trash!`);
  }
);

const UnfavoriteOption = createOption(
  "unfavoriteOption",
  "Unfavorite",
  Icon.Star,
  function (state) {
    appStore.setProcessingStatus(
      "unfavoriteOption",
      `Unfavoriting ${state.selectedItems.length} notes...`
    );

    // we know only notes can be favorited
    state.selectedItems.forEach(async (item) => {
      if (!item.favorite) return;
      await db.notes.note(item.id).favorite();
    });
    notesStore.setContext({ type: "favorites" });
  }
);

const AddToNotebookOption = createOption(
  "atnOption",
  "Add to notebook(s)",
  Icon.AddToNotebook,
  async function (state) {
    appStore.setProcessingStatus(
      "atnOption",
      `Adding ${state.selectedItems.length} notes to notebooks...`
    );

    const items = state.selectedItems.map((item) => item.id);
    await showMoveNoteDialog(items);
    showToast("success", `${items.length} notes moved!`);
  }
);

const ExportOption = createOption(
  "exportOption",
  "Export",
  Icon.Export,
  async function (state) {
    appStore.setProcessingStatus(
      "exportOption",
      `Exporting ${state.selectedItems.length} notes...`
    );

    const items = state.selectedItems.map((item) => item.id);
    if (await showExportDialog(items)) {
      await showToast("success", `${items.length} notes exported!`);
    }
  }
);

const RestoreOption = createOption(
  "restoreOption",
  "Restore",
  Icon.Restore,
  async function (state) {
    appStore.setProcessingStatus(
      "restoreOption",
      `Restoring ${state.selectedItems.length} items...`
    );

    const items = state.selectedItems.map((item) => item.id);
    await db.trash.restore(...items);
    appStore.refresh();
    showToast("success", `${items.length} items restored!`);
  }
);

const NotesOptions = createOptions([AddToNotebookOption, ExportOption]);
const NotebooksOptions = createOptions();
const TopicOptions = createOptions();
const TrashOptions = createOptions([RestoreOption]);
const FavoritesOptions = createOptions([UnfavoriteOption]);

const SelectionOptions = {
  NotebooksOptions,
  NotesOptions,
  TopicOptions,
  TrashOptions,
  FavoritesOptions,
};
export default SelectionOptions;
