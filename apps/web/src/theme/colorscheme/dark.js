import { hexToRGB } from "../../utils/color";
import StaticColorSchemeFactory from "./static";

class DarkColorSchemeFactory {
  constructor(accent) {
    return {
      primary: accent,
      placeholder: hexToRGB("#ffffff", 0.6),
      background: "#1f1f1f",
      accent: "#000",
      bgSecondary: "#2b2b2b",
      bgSecondaryText: "#A1A1A1",
      bgSecondaryPrimary: "#00AA46",
      border: "#2b2b2b",
      hover: "#3b3b3b",
      fontSecondary: "#000",
      fontTertiary: "#A1A1A1",
      text: "#d3d3d3",
      overlay: "rgba(53, 53, 53, 0.5)",
      secondary: "black",
      icon: "#dbdbdb",
      disabled: "#5b5b5b",
      ...new StaticColorSchemeFactory(accent),

      // COLORS
      red: "#f44336",
      orange: "#FF9800",
      yellow: "#FFD600",
      green: "#4CAF50",
      blue: "#2196F3",
      purple: "#9568ED",
      gray: "#9E9E9E",
    };
  }
}
export default DarkColorSchemeFactory;
