import produce, { immerable } from "immer";
import create from "zustand";

function immer(config) {
  return function(set, get, api) {
    const obj = config(
      fn =>
        set(() =>
          produce(get(), state => {
            fn(state);
          })
        ),
      get,
      api
    );
    obj[immerable] = true;
    return obj;
  };
}

function createStore(store) {
  store = store.new ? store.new.bind(store) : store;
  return create(immer(store));
}

export default createStore;
