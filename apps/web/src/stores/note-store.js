import { db } from "../common/index";
import createStore from "../common/store";
import { store as editorStore } from "./editor-store";
import { store as appStore } from "./app-store";
import { showPasswordDialog } from "../components/dialogs/passworddialog";

function noteStore(set, get) {
  return {
    notes: {
      items: [],
      groupCounts: [],
      groups: []
    },
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
        case "favorites":
          notes = db.notes.favorites;
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
    delete: async function(id) {
      await db.notes.delete(id);
      const state = get();
      state.setSelectedContext(state.selectedContext);
      state.refresh();
      const editorState = editorStore.getState();
      if (editorState.session.id === id) {
        editorState.newSession();
      }
    },
    pin: async function(note) {
      await db.notes.note(note).pin();
      set(state => {
        state.notes = db.notes.group(undefined, true);
      });
      syncEditor(note.id, "pinned");
    },
    favorite: async function(note) {
      await db.notes.note(note).favorite();
      setValue(set, note.id, "favorite", !note.favorite);
    },
    unlock: function(noteId) {
      showPasswordDialog("unlock_note", password => {
        return db.vault
          .remove(noteId, password)
          .then(() => true)
          .catch(e => {
            if (e.message === "ERR_WRNG_PWD") return false;
            else console.error(e);
          });
      }).then(res => {
        if (res) {
          setValue(set, noteId, "locked", false);
        }
      });
    },
    lock: function lock(noteId) {
      db.vault
        .add(noteId)
        .then(() => {
          setValue(set, noteId, "locked", true);
        })
        .catch(async ({ message }) => {
          switch (message) {
            case "ERR_NO_VAULT":
              return appStore.getState().createVault();
            case "ERR_VAULT_LOCKED":
              return appStore.getState().unlockVault();
            default:
              return false;
          }
        })
        .then(result => {
          if (result === true) {
            lock(noteId);
          }
        });
    }
  };
}

function syncEditor(noteId, action) {
  const editorState = editorStore.getState();
  if (editorState.session.id === noteId) {
    editorState.setSession(
      state => (state.session[action] = !state.session[action])
    );
  }
}

function setValue(set, noteId, prop, value) {
  set(state => {
    const arr = !state.selectedNotes.length
      ? state.notes.items
      : state.selectedNotes;
    let index = arr.findIndex(n => n.id === noteId);
    if (index < 0) return;
    arr[index][prop] = value;
  });
  syncEditor(noteId, prop);
}

const [useStore, store] = createStore(noteStore);

export { useStore, store };
