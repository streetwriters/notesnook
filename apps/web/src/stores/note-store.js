import { db } from "../common/index";
import createStore from "../common/store";
import { store as trashStore } from "./trash-store";
import { store as editorStore } from "./editor-store";

const LIST_TYPES = {
  fav: "favorites"
};

function noteStore(set, get) {
  return {
    notes: {
      items: [],
      groupCounts: [],
      groups: []
    },
    favorites: [],
    selectedNotes: [],
    selectedContext: {},
    selectedNote: 0,
    setSelectedNote: function(id) {
      set(state => {
        state.selectedNote = id;
      });
    },
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
    setSelectedContext: function(context) {
      let notes = [];
      switch (context.type) {
        case "tag":
          notes = db.notes.tagged(context.value);
          break;
        case "color":
          notes = db.notes.colored(context.value);
          break;
        case "topic":
          notes = db.notebooks
            .notebook(context.notebook.id)
            .topics.topic(context.value).all;
          break;
        default:
          return;
      }
      set(state => {
        state.selectedContext = context;
        state.selectedNotes = notes;
      });
    },
    clearSelectedContext: function() {
      set(state => {
        state.selectedContext = {};
        state.selectedNotes = [];
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
      const editorState = editorStore.getState();
      if (editorState.session.id === id) {
        editorState.newSession();
      }
    },
    pin: async function(note) {
      await db.notes.note(note).pin();
      set(state => {
        state.notes = db.notes.group(undefined, true);
        syncEditor(note, "pinned");
      });
    },
    favorite: async function(note, index) {
      await db.notes.note(note).favorite();
      set(state => {
        if (index < 0 || !index) {
          index = state.notes.items.findIndex(n => n.id === note.id);
          if (index < 0) return;
        }
        state.notes.items[index].favorite = !note.favorite;
        syncEditor(note, "favorite");
      });
      get().refreshList(LIST_TYPES.fav);
    }
  };
}

function syncEditor(note, action) {
  const editorState = editorStore.getState();
  if (editorState.session.id === note.id) {
    editorState.setSession(
      state => (state.session[action] = !state.session[action])
    );
  }
}

const [useStore, store] = createStore(noteStore);

export { useStore, store, LIST_TYPES };
