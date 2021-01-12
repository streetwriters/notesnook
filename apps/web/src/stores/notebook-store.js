import { db } from "../common/index";
import createStore from "../common/store";
import { store as trashStore } from "./trash-store";
import { store as appStore } from "./app-store";
import BaseStore from "./index";
import { showToast } from "../utils/toast";

class NotebookStore extends BaseStore {
  notebooks = [];
  selectedNotebookTopics = [];
  selectedNotebookId = 0;

  refresh = () => {
    this.set((state) => (state.notebooks = db.notebooks.all));
  };

  add = async (nb) => {
    let notebook = await db.notebooks.add(nb);
    if (notebook) {
      this.refresh();
    }
  };

  delete = async (id, index) => {
    await db.notebooks.delete(id);
    this.set((state) => {
      state.notebooks.splice(index, 1);
      trashStore.refresh();
      appStore.refreshMenuPins();
    });
  };

  pin = async (notebookId) => {
    // TODO (hack) We probably shouldn't do this here.
    if (db.notebooks.pinned.length >= 3) {
      return await showToast("error", "You cannot pin more than 3 notebooks.");
    }
    await db.notebooks.notebook(notebookId).pin();
    this.refresh();
  };

  setSelectedNotebookTopics = (id) => {
    this.set((state) => {
      state.selectedNotebookTopics = db.notebooks.notebook(id).topics.all;
      state.selectedNotebookId = id;
    });
  };
}

/**
 * @type {[import("zustand").UseStore<NotebookStore>, NotebookStore]}
 */
const [useStore, store] = createStore(NotebookStore);
export { useStore, store };
