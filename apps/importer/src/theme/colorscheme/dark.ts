import Color from "color";
import { StaticColors } from "./static";

export class DarkColorScheme {
  static construct(accent: Color) {
    return {
      primary: accent.hex().toString(),
      placeholder: Color("#ffffff").alpha(0.6).hex().toString(),
      background: "#1f1f1f",
      bgTransparent: "#1f1f1f99",
      accent: "#000",
      bgSecondary: "#2b2b2b",
      bgSecondaryText: "#A1A1A1",
      border: "#2b2b2b",
      hover: "#3b3b3b",
      fontSecondary: "#000",
      fontTertiary: "#A1A1A1",
      text: "#d3d3d3",
      overlay: "rgba(53, 53, 53, 0.5)",
      secondary: "black",
      icon: "#dbdbdb",
      disabled: "#5b5b5b",
      ...StaticColors.construct(accent),
    };
  }
}
