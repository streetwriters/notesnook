import produce from "immer";
import create from "zustand";

function immer(config) {
  return function(set, get, api) {
    return config(fn => set(produce(fn)), get, api);
  };
}

function createStore(store) {
  return create(immer(store));
}

export default createStore;
