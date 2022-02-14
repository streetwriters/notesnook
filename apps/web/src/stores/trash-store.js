import { db } from "../common/db";
import createStore from "../common/store";
import BaseStore from "./index";
import { store as appStore } from "./app-store";
import { store as notestore } from "./note-store";
import { groupArray } from "notes-core/utils/grouping";

class TrashStore extends BaseStore {
  trash = [];

  refresh = () => {
    this.set(
      (state) =>
        (state.trash = groupArray(
          db.trash.all,
          db.settings.getGroupOptions("trash")
        ))
    );
  };

  delete = (ids, commit = false) => {
    if (!commit) {
      return this.set((state) => {
        for (let id of ids) {
          const index = state.trash.findIndex((item) => item.id === id);
          if (index > -1) state.trash.splice(index, 1);
        }
      });
    }
    return db.trash.delete(...ids);
  };

  restore = (ids) => {
    return db.trash.restore(...ids).then(() => {
      this.refresh();
      appStore.refreshNavItems();
      notestore.refresh();
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
