import { ColorSchemes } from "./colorscheme";
import { Accents } from "./accents";

export type ThemeConfig = {
  theme: ColorSchemes;
  accent: Accents;
  scale?: number;
};
