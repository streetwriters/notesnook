import createStore from "../common/store";
import { db } from "../common";

function searchStore(set, get) {
  return {
    type: "",
    items: [],
    item: undefined,
    results: [],
    setSearchContext: function(context) {
      set(state => {
        state.type = context.type;
        state.items = context.items;
        state.item = context.item;
      });
    },
    search: function(query) {
      const { items, type } = get();
      set(state => {
        state.results = db.lookup[type](items, query);
      });
    }
  };
}

const [useStore, store] = createStore(searchStore);

export { useStore, store };
