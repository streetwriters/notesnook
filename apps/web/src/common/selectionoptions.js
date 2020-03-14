import * as Icon from "react-feather";
import { store as appStore } from "../stores/app-store";
import { store as notesStore, LIST_TYPES } from "../stores/note-store";
import { store as nbStore } from "../stores/notebook-store";
import { store as editorStore } from "../stores/editor-store";
import { db } from "./index";
import { showMoveNoteDialog } from "../components/dialogs/movenotedialog";
import { confirm } from "../components/dialogs/confirm";

function createOption(icon, onClick) {
  return {
    icon,
    onClick: async () => {
      await onClick.call(this, appStore.getState());
      appStore.getState().exitSelectionMode();
    }
  };
}

function createOptions(options = []) {
  return [...options, DeleteOption];
}

const DeleteOption = createOption(Icon.Trash2, async function(state) {
  if (
    !(await confirm(Icon.Trash2, "Delete", "Are you sure you want to proceed?"))
  )
    return;
  const item = state.selectedItems[0];
  var isAnyNoteOpened = false;
  const editorState = editorStore.getState();
  const items = state.selectedItems.map(item => {
    if (item.id === editorState.session.id) isAnyNoteOpened = true;
    return item.id;
  });

  if (isAnyNoteOpened) {
    editorState.newSession();
  }

  if (item.type === "note") {
    await db.notes.delete(...items);
    notesStore.getState().refresh();
  } else if (item.type === "notebook") {
    await db.notebooks.delete(...items);
    nbStore.getState().refresh();
  } else if (item.notebookId) {
    // its a topic
    await db.notebooks.notebook(item.notebookId).topics.delete(...items);
    // TODO refresh topics
  }
});

const FavoriteOption = createOption(Icon.Star, function(state) {
  // we know only notes can be favorited
  state.selectedItems.forEach(async item => {
    if (item.favorite) return;
    await db.notes.note(item.id).favorite();
  });
  notesStore.getState().refresh();
});

const UnfavoriteOption = createOption(Icon.Star, function(state) {
  // we know only notes can be favorited
  state.selectedItems.forEach(async item => {
    if (!item.favorite) return;
    await db.notes.note(item.id).favorite();
  });
  notesStore.getState().refreshList(LIST_TYPES.fav);
});

const AddToNotebookOption = createOption(Icon.Plus, async function(state) {
  const items = state.selectedItems.map(item => item.id);
  if (await showMoveNoteDialog(items)) {
    //TODO show proper snack
    console.log("Notes moved successfully!");
  }
});

const NotesOptions = createOptions([AddToNotebookOption, FavoriteOption]);
const NotebooksOptions = createOptions();
const TopicOptions = createOptions();
const TrashOptions = createOptions();
const FavoritesOptions = createOptions([UnfavoriteOption]);

export default {
  NotebooksOptions,
  NotesOptions,
  TopicOptions,
  TrashOptions,
  FavoritesOptions
};
