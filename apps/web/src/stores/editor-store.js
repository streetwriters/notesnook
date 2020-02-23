import createStore from "../common/store";
import { db } from "../common";

const DEFAULT_SESSION = {
  title: "",
  timeout: 0,
  id: "",
  pinned: false,
  favorite: false,
  tags: [],
  colors: [],
  content: {
    text: "",
    delta: undefined
  }
};

function editorStore(set) {
  return {
    session: DEFAULT_SESSION,
    newSession: async function(note) {
      const content = {
        text: note.text,
        delta: await db.notes.note(note).delta()
      };
      set(state => {
        //state.clearSession();
        state.session.title = note.title;
        state.session.content = content;
      });
    },
    saveSession: function() {},
    setSession: function(session) {
      set(session);
    },
    clearSession: function() {
      set(state => {
        clearTimeout(state.session.timeout);
        state.session = DEFAULT_SESSION;
      });
    }
  };
}

const [useStore, store] = createStore(editorStore);

export { useStore, store };
