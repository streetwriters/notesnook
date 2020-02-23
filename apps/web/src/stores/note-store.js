import { db } from "../common/index";
import createStore from "../common/store";

function noteStore(set) {
  return {
    init: function() {
      set(state => {
        //TODO save group type
        state.notes = db.notes.group(undefined, true);
      });
    },
    notes: {
      items: [],
      groupCounts: [],
      groups: []
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
      });
    },
    pin: async function(note, index) {
      await db.notes.note(note).pin();
      set(state => {
        state.notes = db.notes.group(undefined, true);
      });
    },
    favorite: async function(note, index) {
      await db.notes.note(note).favorite();
      set(state => {
        state.notes.items[index].favorite = !note.favorite;
      });
    }
  };
}

const [useStore, store] = createStore(noteStore);

export { useStore, store };
