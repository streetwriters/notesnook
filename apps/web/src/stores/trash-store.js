import { db } from "../common/index";
import createStore from "../common/store";

function trashStore(set) {
  return {
    refresh: function() {
      set(state => {
        state.trash = db.trash.all;
      });
    },
    trash: [],
    delete: function(id, index) {
      return db.trash.delete(id).then(() => {
        set(state => {
          state.trash.splice(index, 1);
        });
      });
    },
    restore: function(id, index) {
      return db.trash.restore(id).then(() => {
        set(state => {
          state.trash.splice(index, 1);
        });
      });
    },
    clear: function() {
      return db.trash.clear().then(() => {
        set(state => {
          state.trash = [];
        });
      });
    }
  };
}

const [useStore, store] = createStore(trashStore);

export { useStore, store };
