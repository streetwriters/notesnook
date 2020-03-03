import * as Icon from "react-feather";
import { store as appStore } from "../stores/app-store";
import { store as notesStore } from "../stores/note-store";
import { store as nbStore } from "../stores/notebook-store";
import { db } from "./index";

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
  const item = state.selectedItems[0];
  const items = state.selectedItems.map(item => item.id);

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
  notesStore.getState().refresh();
});

const AddToNotebookOption = createOption(Icon.Plus, function() {});

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
