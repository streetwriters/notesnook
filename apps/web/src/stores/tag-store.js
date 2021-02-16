import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";

class TagStore extends BaseStore {
  tags = [];

  refresh = () => {
    this.set((state) => (state.tags = db.tags.all));
  };
}

/**
 * @type {[import("zustand").UseStore<TagStore>, TagStore]}
 */
const [useStore, store] = createStore(TagStore);
export { useStore, store };
