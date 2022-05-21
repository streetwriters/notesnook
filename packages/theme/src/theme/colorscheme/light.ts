import tinycolor from "tinycolor2";
import { SchemeColors } from ".";
import { getStaticColors } from "./static";

export function getLightScheme(accent: string): SchemeColors {
  return {
    primary: accent,
    background: "white",
    bgTransparent: "#ffffff99",
    accent: "white",
    bgSecondary: "#f7f7f7",
    bgSecondaryText: "#5E5E5E",
    border: "#e5e5e5",
    hover: "#f0f0f0",
    fontSecondary: "white",
    fontTertiary: "#656565",
    text: "#202124",
    overlay: "rgba(0, 0, 0, 0.1)",
    secondary: "white",
    icon: "#3b3b3b",
    disabled: "#9b9b9b",
    placeholder: tinycolor("#000000").setAlpha(0.6).toRgbString(),
    checked: "#505050",
    ...getStaticColors(accent),

    red: "#f44336",
    orange: "#FF9800",
    yellow: "#f0c800",
    green: "#4CAF50",
    blue: "#2196F3",
    purple: "#9568ED",
    gray: "#9E9E9E",
  };
}
