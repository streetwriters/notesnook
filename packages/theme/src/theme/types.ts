import { ColorSchemes } from "./colorscheme";

export type ThemeConfig = {
  theme: ColorSchemes;
  accent: string;
  scale?: number;
};
