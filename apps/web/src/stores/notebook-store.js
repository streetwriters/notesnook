import { db } from "../common/index";
import createStore from "../common/store";

function notebookStore(set) {
  return {
    init: function() {
      set(state => {
        state.notebooks = db.notebooks.all;
      });
    },
    notebooks: [],
    add: async function(nb) {
      let notebook = await db.notebooks.add(nb);
      if (notebook) {
        set(state => state.notebooks.push(nb));
      }
    },
    delete: function() {},
    update: function() {},
    pin: async function(notebook, index) {
      await db.notebooks.notebook(notebook).pin();
      set(state => (state.notebooks[index].pinned = !notebook.pinned));
    },
    favorite: async function(notebook, index) {
      await db.notebooks.notebook(notebook).favorite();
      set(state => (state.notebooks[index].favorite = !notebook.favorite));
    }
  };
}

const [useStore, store] = createStore(notebookStore);

export { useStore, store };
