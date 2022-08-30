import { Appearance } from "react-native";
import create, { State } from "zustand";
import { COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT } from "../utils/color-scheme";

const darkScheme = Appearance.getColorScheme() === "dark";
export interface ThemeStore extends State {
  colors: typeof COLOR_SCHEME_LIGHT;
  setColors: (colors: typeof COLOR_SCHEME_LIGHT) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  colors: darkScheme ? COLOR_SCHEME_DARK : COLOR_SCHEME_LIGHT,
  setColors: (colors) => {
    set({ colors });
  }
}));

export type ColorKey = keyof ThemeStore["colors"];
