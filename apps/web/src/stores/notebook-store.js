import { db } from "../common/index";
import createStore from "../common/store";
import { store as trashStore } from "./trash-store";
import BaseStore from "./index";

class NotebookStore extends BaseStore {
  notebooks = [];
  selectedNotebookTopics = [];

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
    });
  };

  pin = async (notebookId) => {
    await db.notebooks.notebook(notebookId).pin();
    this.refresh();
  };

  setSelectedNotebookTopics = (id) => {
    this.set((state) => {
      state.selectedNotebookTopics = db.notebooks.notebook(id).topics.all;
    });
  };
}

/**
 * @type {[import("zustand").UseStore<NotebookStore>, NotebookStore]}
 */
const [useStore, store] = createStore(NotebookStore);
export { useStore, store };
