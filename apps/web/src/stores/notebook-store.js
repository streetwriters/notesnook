import { db } from "../common/db";
import createStore from "../common/store";
import { store as appStore } from "./app-store";
import { store as noteStore } from "./note-store";
import BaseStore from "./index";
import { groupArray } from "notes-core/utils/grouping";
import Config from "../utils/config";

class NotebookStore extends BaseStore {
  notebooks = [];
  selectedNotebookTopics = [];
  selectedNotebookId = 0;
  viewMode = Config.get("notebooks:viewMode", "detailed");

  setViewMode = (viewMode) => {
    this.set((state) => (state.viewMode = viewMode));
    Config.set("notebooks:viewMode", viewMode);
  };

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
    const notebook = db.notebooks.notebook(notebookId);
    if (!notebook._notebook.pinned && db.notebooks.pinned.length >= 3) {
      throw new Error("You cannot pin more than 3 notebooks.");
    }
    await notebook.pin();
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
