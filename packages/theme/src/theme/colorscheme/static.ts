import tinycolor from "tinycolor2";

export type StaticColors = {
  shade: string;
  textSelection: string;
  dimPrimary: string;
  transparent: string;
  static: string;
  error: string;
  errorBg: string;
  success: string;
  warn: string;
  warnBg: string;
  favorite: string;
};
export function getStaticColors(accent: string): StaticColors {
  return {
    shade: tinycolor(accent).setAlpha(0.1).toRgbString(),
    textSelection: tinycolor(accent).setAlpha(0.2).toRgbString(),
    dimPrimary: tinycolor(accent).setAlpha(0.7).toRgbString(),
    transparent: "transparent",
    static: "white",
    error: "#E53935",
    errorBg: "#E5393520",
    success: "#4F8A10",
    warn: "#FF5722",
    warnBg: "#FF572220",
    favorite: "#ffd700",
  };
}
