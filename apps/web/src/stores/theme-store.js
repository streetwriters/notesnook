import createStore from "../common/store";
import BaseStore from "./index";
import Config from "../utils/config";
import { getDefaultAccentColor } from "../theme/accents";
import changeAppTheme from "../commands/change-app-theme";

class ThemeStore extends BaseStore {
  theme = Config.get("theme", "light");
  accent = Config.get("accent", getDefaultAccentColor());
  followSystemTheme = Config.get("followSystemTheme", false);

  setTheme = (theme) => {
    if (!this.get().followSystemTheme) changeAppTheme(theme);
    this.set((state) => (state.theme = theme));
    Config.set("theme", theme);
  };

  toggleNightMode = () => {
    const theme = this.get().theme;
    this.setTheme(theme === "dark" ? "light" : "dark");
  };

  setAccent = (accent) => {
    this.set((state) => (state.accent = accent));
    Config.set("accent", accent);
  };

  setFollowSystemTheme = (followSystemTheme) => {
    this.set((state) => (state.followSystemTheme = followSystemTheme));
    Config.set("followSystemTheme", followSystemTheme);
    changeAppTheme(followSystemTheme ? "system" : "light");
  };

  toggleFollowSystemTheme = () => {
    const followSystemTheme = this.get().followSystemTheme;
    this.setFollowSystemTheme(!followSystemTheme);
  };
}

/**
 * @type {[import("zustand").UseStore<ThemeStore>, ThemeStore]}
 */
const [useStore, store] = createStore(ThemeStore);
export { useStore, store };
