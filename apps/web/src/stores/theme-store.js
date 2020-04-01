import createStore from "../common/store";
import BaseStore from "./index";

class ThemeStore extends BaseStore {
  theme = "light";
  accent = "#0560ff";

  setTheme = theme => {
    this.set(state => (state.theme = theme));
  };

  toggleNightMode = () => {
    const theme = this.theme;
    this.setTheme(theme === "dark" ? "light" : "dark");
  };

  setAccent = accent => {
    this.set(state => (state.accent = accent));
  };
}

/**
 * @type {[import("zustand").UseStore<ThemeStore>, ThemeStore]}
 */
const [useStore, store] = createStore(ThemeStore);
export { useStore, store };
