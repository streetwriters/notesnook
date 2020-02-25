import { db } from "../common/index";
import createStore from "../common/store";
import { store as trashStore } from "./trash-store";

const LIST_TYPES = {
  fav: "favorites"
};

function noteStore(set) {
  return {
    notes: {
      items: [],
      groupCounts: [],
      groups: []
    },
    favorites: [],
    refresh: function() {
      set(state => {
        //TODO save group type
        state.notes = db.notes.group(undefined, true);
      });
    },
    refreshList: function(listType) {
      set(state => {
        state[listType] = db.notes[listType];
      });
    },
    delete: async function(id, info) {
      await db.notes.delete(id);
      set(state => {
        state.notes.items.splice(info.index, 1);
        state.notes.groupCounts[info.groupIndex]--;
        if (state.notes.groupCounts[info.groupIndex] <= 0) {
          state.notes.groups.splice(info.groupIndex, 1);
          state.notes.groupCounts.splice(info.groupIndex, 1);
        }
        trashStore.getState().refresh();
      });
    },
    pin: async function(note) {
      await db.notes.note(note).pin();
      set(state => {
        state.notes = db.notes.group(undefined, true);
      });
    },
    favorite: async function(note, index) {
      await db.notes.note(note).favorite();
      set(state => {
        if (index < 0) {
          index = state.notes.findIndex(n => n.id === note.id);
          if (index < 0) return;
        }
        state.notes.items[index].favorite = !note.favorite;
        state.initList("favorites");
      });
    }
  };
}

const [useStore, store] = createStore(noteStore);

export { useStore, store, LIST_TYPES };
