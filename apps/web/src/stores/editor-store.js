import createStore from "../common/store";
import { store as noteStore, LIST_TYPES } from "./note-store";
import { store as appStore } from "./app-store";
import { db } from "../common";

const SESSION_STATES = {
  stale: "stale",
  new: "new"
};

const DEFAULT_SESSION = {
  state: "",
  isSaving: false,
  title: "",
  timeout: 0,
  id: "",
  pinned: false,
  favorite: false,
  tags: [],
  colors: [],
  dateEdited: 0,
  content: {
    text: "",
    delta: {
      ops: []
    }
  }
};

function editorStore(set, get) {
  return {
    session: DEFAULT_SESSION,
    openSession: async function(note) {
      const content = {
        text: note.content.text,
        delta: await db.notes.note(note).delta()
      };
      noteStore.getState().setSelectedNote(note.id);
      set(state => {
        clearTimeout(state.session.timeout);
        state.session = {
          ...DEFAULT_SESSION,
          id: note.id,
          title: note.title,
          pinned: note.pinned,
          favorite: note.favorite,
          colors: note.colors,
          tags: note.tags,
          dateEdited: note.dateEdited,
          content,
          state: SESSION_STATES.new
        };
      });
    },
    saveSession: function(oldSession) {
      set(state => {
        state.session.isSaving = true;
      });
      const { session } = get();
      const { title, id, content, pinned, favorite, tags, colors } = session;
      let note = {
        content,
        title,
        id,
        favorite,
        pinned,
        tags,
        colors
      };
      db.notes.add(note).then(id => {
        if (tags.length > 0) updateContext("tags", tags);
        if (colors.length > 0) {
          updateContext("colors", colors);
          appStore.getState().refreshColors();
        }
        set(state => {
          if (state.session.id === "") {
            noteStore.getState().setSelectedNote(id);
          }
          state.session.id = id;
          state.session.isSaving = false;
          noteStore.getState().refresh();

          // we update favorites only if favorite has changed
          if (!oldSession || oldSession.favorite !== session.favorite) {
            noteStore.getState().refreshList(LIST_TYPES.fav);
          }
        });
      });
    },
    setSession: function(session) {
      const oldSession = get().session;
      set(state => {
        state.session.state = SESSION_STATES.stale;
        session(state);
        clearTimeout(state.session.timeout);
        state.session.timeout = setTimeout(() => {
          get().saveSession(oldSession);
        }, 500);
      });
    },
    newSession: function(context = {}) {
      set(state => {
        clearTimeout(state.session.timeout);
        state.session = {
          ...DEFAULT_SESSION,
          ...context,
          state: SESSION_STATES.new
        };
      });
    },
    setColor: function(color) {
      setTagOrColor(get().session, "colors", color, "color", get().setSession);
    },
    setTag: function(tag) {
      setTagOrColor(get().session, "tags", tag, "tag", get().setSession);
    }
  };
}

function setTagOrColor(session, array, value, func, set) {
  console.log(arguments);
  const { [array]: arr, id } = session;
  let note = db.notes.note(id);
  if (!note) return;
  let index = arr.indexOf(value);
  if (index > -1) {
    note[`un${func}`](value).then(() => {
      set(state => {
        state.session[array].splice(index, 1);
      });
    });
  } else {
    note[func](value).then(() => {
      set(state => {
        state.session[array].push(value);
      });
    });
  }
}

function updateContext(key, array) {
  let type = key === "colors" ? "color" : "tag";
  // update notes if the selected context (the current view in the navigator) is a tag or color
  const notesState = noteStore.getState();
  const context = notesState.selectedContext;
  if (context.type === type) {
    array.forEach(value => {
      if (context.value === value) {
        noteStore.getState().setSelectedContext(context);
      }
    });
  }
}

const [useStore, store] = createStore(editorStore);

export { useStore, store, SESSION_STATES };
