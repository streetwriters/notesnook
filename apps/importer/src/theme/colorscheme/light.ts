import Color from "color";
import { StaticColors } from "./static";

export class LightColorScheme {
  static construct(accent: Color) {
    return {
      primary: accent.hex().toString(),
      background: "white",
      bgTransparent: "#ffffff99",
      accent: "white",
      bgSecondary: "#f7f7f7",
      bgSecondaryText: "#5E5E5E",
      border: "#e7e7e7",
      hover: "#f0f0f0",
      active: "#ababab",
      fontSecondary: "white",
      fontTertiary: "#656565",
      text: "#202124",
      overlay: "rgba(0, 0, 0, 0.1)",
      secondary: "white",
      icon: "#3b3b3b",
      disabled: "#9b9b9b",
      placeholder: Color("#000000").alpha(0.6).hex().toString(),
      ...StaticColors.construct(accent),
    };
  }
}
