import { getDarkScheme } from "./dark";
import { getLightScheme } from "./light";
import { StaticColors } from "./static";

const colorSchemes = {
  dark: getDarkScheme,
  light: getLightScheme,
};

export type ColorSchemes = keyof typeof colorSchemes;
export function getColors(theme: ColorSchemes, accent: string) {
  return colorSchemes[theme](accent);
}

export type SchemeColors = StaticColors & {
  primary: string;
  placeholder: string;
  background: string;
  bgTransparent: string;
  accent: string;
  bgSecondary: string;
  bgSecondaryText: string;
  border: string;
  hover: string;
  fontSecondary: string;
  fontTertiary: string;
  text: string;
  overlay: string;
  secondary: string;
  icon: string;
  disabled: string;
  checked: string;

  red: string;
  orange: string;
  yellow: string;
  green: string;
  blue: string;
  purple: string;
  gray: string;
};
