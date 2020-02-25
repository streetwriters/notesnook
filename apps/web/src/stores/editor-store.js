import createStore from "../common/store";
import { store as notestore, LIST_TYPES } from "./note-store";
import { db } from "../common";

const SESSION_STATES = {
  stale: "stale",
  new: "new"
};

const DEFAULT_SESSION = {
  state: "",
  title: "",
  timeout: 0,
  id: "",
  pinned: false,
  favorite: false,
  tags: [],
  colors: [],
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
          content,
          state: SESSION_STATES.new
        };
      });
    },
    saveSession: function(oldSession) {
      const { session } = get();
      const { title, id, content, pinned, favorite } = session;
      let note = {
        content,
        title,
        id,
        favorite,
        pinned
      };
      db.notes.add(note).then(id => {
        set(state => {
          state.session.id = id;
          notestore.getState().refresh();

          // we update favorites only if favorite has changed
          if (!oldSession || oldSession.favorite !== session.favorite) {
            notestore.getState().refreshList(LIST_TYPES.fav);
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
      setTagOrColor(get().session, "colors", color, "color", set);
    },
    setTag: function(tag) {
      setTagOrColor(get().session, "tags", tag, "tag", set);
    }
  };
}

function setTagOrColor(session, array, value, func, set) {
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

const [useStore, store] = createStore(editorStore);

export { useStore, store, SESSION_STATES };
