import createStore from "../common/store";
import { db } from "../common";
import BaseStore from "./index";

class SearchStore extends BaseStore {
  type = "";
  items = [];
  item = undefined;
  results = [];

  setSearchContext = context => {
    this.set(state => {
      state.type = context.type;
      state.items = context.items;
      state.item = context.item;
    });
  };

  search = async query => {
    const { items, type } = this;
    const results = await db.lookup[type](items, query);
    console.log(query, results);
    this.set(state => (state.results = results));
  };
}

/**
 * @type {[import("zustand").UseStore<SearchStore>, SearchStore]}
 */
const [useStore, store] = createStore(SearchStore);
export { useStore, store };
