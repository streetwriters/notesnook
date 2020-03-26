import createStore from "../common/store";

function themeStore(set, get) {
  return {
    theme: "light",
    accent: "#0560ff",
    setTheme: function(theme) {
      set(state => {
        state.theme = theme;
      });
    },
    toggleNightMode: function() {
      const theme = get().theme;
      get().setTheme(theme === "dark" ? "light" : "dark");
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
