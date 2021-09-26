import { hexToRGB } from "../../utils/color";
import StaticColorSchemeFactory from "./static";

class LightColorSchemeFactory {
  constructor(accent) {
    return {
      primary: accent,
      background: "white",
      accent: "white",
      bgSecondary: "#f7f7f7",
      bgSecondaryText: "#5E5E5E",
      bgSecondaryPrimary: "#008234",
      border: "#d7d7d7",
      hover: "#e7e7e7",
      fontSecondary: "white",
      fontTertiary: "#656565",
      text: "#202124",
      overlay: "rgba(0, 0, 0, 0.1)",
      secondary: "white",
      icon: "#3b3b3b",
      disabled: "#9b9b9b",
      placeholder: hexToRGB("#000000", 0.6),
      ...new StaticColorSchemeFactory(accent),

      // COLORS
      red: "#D93B30",
      orange: "#C75301",
      yellow: "#AC660D",
      green: "#4CAF50",
      blue: "#197AC7",
      purple: "#673AB7",
      gray: "#777777",
    };
  }
}
export default LightColorSchemeFactory;
