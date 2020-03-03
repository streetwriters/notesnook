import { db } from "../common/index";
import createStore from "../common/store";
import { store as trashStore } from "./trash-store";

function notebookStore(set, get) {
  return {
    refresh: function() {
      set(state => {
        state.notebooks = db.notebooks.all;
      });
    },
    notebooks: [],
    add: async function(nb) {
      let notebook = await db.notebooks.add(nb);
      if (notebook) {
        get().refresh();
      }
    },
    delete: async function(id, index) {
      await db.notebooks.delete(id);
      set(state => {
        state.notebooks.splice(index, 1);
        trashStore.getState().refresh();
      });
    },
    update: function() {},
    pin: async function(notebook, index) {
      await db.notebooks.notebook(notebook).pin();
      set(state => {
        state.notebooks[index].pinned = !notebook.pinned;
      });
    }
  };
}

const [useStore, store] = createStore(notebookStore);

export { useStore, store };
