import createStore from "../common/store";
import { db } from "../common";
import BaseStore from "./index";

class SearchStore extends BaseStore {
  results = [];

  search = async (items, query) => {
    const { type } = this.get();
    const results = await db.lookup[type](items, query);
    this.set((state) => (state.results = results));
  };
}

/**
 * @type {[import("zustand").UseStore<SearchStore>, SearchStore]}
 */
const [useStore, store] = createStore(SearchStore);
export { useStore, store };
