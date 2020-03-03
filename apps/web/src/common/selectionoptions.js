import * as Icon from "react-feather";
import { store } from "../stores/app-store";
import { db } from "./index";

function createOption(icon, onClick) {
  return { icon, onClick: onClick.bind(this, store.getState()) };
}

function createOptions(options = []) {
  return [...options, DeleteOption];
}

const DeleteOption = createOption(Icon.Trash2, function(state) {
  const items = state.selectedItems.map(item => item.id);
  const item = items[0];
  if (item.type === "note") {
    db.notes.delete(...item);
  }
});
const FavoriteOption = createOption(Icon.Star, function() {});
const UnfavoriteOption = createOption(Icon.Star, function() {});
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
