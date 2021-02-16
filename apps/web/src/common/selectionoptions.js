import * as Icon from "../components/icons";
import { store as selectionStore } from "../stores/selection-store";
import { store as notesStore } from "../stores/note-store";
import { store as nbStore } from "../stores/notebook-store";
import { store as editorStore } from "../stores/editor-store";
import { store as trashStore } from "../stores/trash-store";
import { db } from "./index";
import { showMoveNoteDialog } from "../components/dialogs/movenotedialog";
import { showMultiDeleteConfirmation } from "../components/dialogs/confirm";
import { showExportDialog } from "../components/dialogs/exportdialog";
import { showToast } from "../utils/toast";

function createOption(key, icon, onClick) {
  return {
    key,
    icon,
    onClick: async () => {
      await onClick.call(this, selectionStore.get());
      selectionStore.toggleSelectionMode(false);
    },
  };
}

function createOptions(options = []) {
  return [...options, DeleteOption];
}

const DeleteOption = createOption(
  "deleteOption",
  Icon.Trash,
  async function (state) {
    const item = state.selectedItems[0];

    if (!(await showMultiDeleteConfirmation(item.type))) return;

    var isAnyNoteOpened = false;
    const items = state.selectedItems.map((item) => {
      if (item.id === editorStore.get().session.id) isAnyNoteOpened = true;
      if (item.locked) return 0;
      return item.id;
    });

    if (item.dateDeleted) {
      // we are in trash
      await db.trash.delete(...items);
      trashStore.refresh();
      return;
    }

    if (isAnyNoteOpened) {
      editorStore.newSession();
    }

    if (item.type === "note") {
      await db.notes.delete(...items);
      notesStore.refresh();
    } else if (item.type === "notebook") {
      await db.notebooks.delete(...items);
      nbStore.refresh();
    } else if (item.type === "topic") {
      await db.notebooks.notebook(item.notebookId).topics.delete(...items);
      nbStore.setSelectedNotebook(item.notebookId);
    }
    showToast("success", `${items.length} ${item.type}s moved to trash!`);
  }
);

const UnfavoriteOption = createOption(
  "unfavoriteOption",
  Icon.Star,
  function (state) {
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
  Icon.AddToNotebook,
  async function (state) {
    const items = state.selectedItems.map((item) => item.id);
    await showMoveNoteDialog(items);
    showToast("success", `${items.length} notes moved!`);
  }
);

const ExportOption = createOption(
  "exportOption",
  Icon.Export,
  async function (state) {
    const items = state.selectedItems.map((item) => item.id);
    if (await showExportDialog(items)) {
      await showToast("success", `${items.length} notes exported!`);
    }
  }
);

const RestoreOption = createOption(
  "restoreOption",
  Icon.Restore,
  async function (state) {
    const items = state.selectedItems.map((item) => item.id);
    await db.trash.restore(...items);
    trashStore.refresh();
    showToast("success", `${items.length} items restored!`);
  }
);

const NotesOptions = createOptions([AddToNotebookOption, ExportOption]);
const NotebooksOptions = createOptions();
const TopicOptions = createOptions();
const TrashOptions = createOptions([RestoreOption]);
const FavoritesOptions = createOptions([UnfavoriteOption]);

export default {
  NotebooksOptions,
  NotesOptions,
  TopicOptions,
  TrashOptions,
  FavoritesOptions,
};
