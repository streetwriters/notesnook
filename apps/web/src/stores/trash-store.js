import { db } from "../common/index";
import createStore from "../common/store";
import BaseStore from "./index";

class TrashStore extends BaseStore {
  trash = [];

  refresh = () => {
    this.set((state) => (state.trash = db.trash.all));
  };

  delete = (id, index) => {
    return db.trash.delete(id).then(() => {
      this.set((state) => {
        state.trash.splice(index, 1);
      });
    });
  };

  restore = (id, index) => {
    return db.trash.restore(id).then(() => {
      this.set((state) => state.trash.splice(index, 1));
    });
  };

  clear = () => {
    return db.trash.clear().then(() => {
      this.set((state) => (state.trash = []));
    });
  };
}

/**
 * @type {[import("zustand").UseStore<TrashStore>, TrashStore]}
 */
const [useStore, store] = createStore(TrashStore);
export { useStore, store };
