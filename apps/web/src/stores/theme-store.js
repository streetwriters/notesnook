import createStore from "../common/store";

function themeStore(set) {
  return {
    theme: "light",
    accent: "#0560ff",
    setTheme: function(theme) {
      set(state => {
        state.theme = theme;
      });
    },
    setAccent: function(accent) {
      set(state => {
        state.accent = accent;
      });
    }
  };
}

const [useStore, store] = createStore(themeStore);

export { useStore, store };
