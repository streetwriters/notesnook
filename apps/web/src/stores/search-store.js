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
    search: async function(query) {
      const { items, type } = get();
      const results = await db.lookup[type](items, query);
      console.log(query, results);
      set(state => {
        state.results = results;
      });
    }
  };
}

const [useStore, store] = createStore(searchStore);

export { useStore, store };
