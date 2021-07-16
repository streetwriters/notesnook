import { db } from "../common/db";
import createStore from "../common/store";
import { store as appStore } from "./app-store";
import { store as noteStore } from "./note-store";
import BaseStore from "./index";
import { showToast } from "../utils/toast";
import { groupArray } from "notes-core/utils/grouping";

class NotebookStore extends BaseStore {
  notebooks = [];
  selectedNotebookTopics = [];
  selectedNotebookId = 0;

  refresh = () => {
    this.set((state) => {
      state.notebooks = groupArray(
        db.notebooks.all,
        db.settings.getGroupOptions("notebooks")
      );
    });
    this.setSelectedNotebook(this.get().selectedNotebookId);
  };

  delete = async (id) => {
    await db.notebooks.delete(id);
    this.refresh();
    appStore.refreshMenuPins();
    noteStore.refresh();
  };

  pin = async (notebookId) => {
    // TODO (hack) We probably shouldn't do this here.
    if (db.notebooks.pinned.length >= 3) {
      return await showToast("error", "You cannot pin more than 3 notebooks.");
    }
    await db.notebooks.notebook(notebookId).pin();
    this.refresh();
  };

  setSelectedNotebook = (id) => {
    const topics = db.notebooks.notebook(id)?.topics?.all;
    if (!topics) return;
    this.set((state) => {
      state.selectedNotebookTopics = groupArray(
        topics,
        db.settings.getGroupOptions("topics")
      );
      state.selectedNotebookId = id;
    });
  };
}

/**
 * @type {[import("zustand").UseStore<NotebookStore>, NotebookStore]}
 */
const [useStore, store] = createStore(NotebookStore);
export { useStore, store };
