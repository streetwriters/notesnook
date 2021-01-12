import { hexToRGB } from "../../utils/color";
import StaticColorSchemeFactory from "./static";

class LightColorSchemeFactory {
  constructor(accent) {
    return {
      primary: accent,
      background: "white",
      accent: "white",
      bgSecondary: "#f7f7f7",
      border: "#e7e7e7",
      hover: "#e0e0e0",
      fontSecondary: "white",
      fontTertiary: "#5b5b5b",
      text: "#202124",
      overlay: "rgba(0, 0, 0, 0.1)",
      secondary: "white",
      icon: "#3b3b3b",
      disabled: "#9b9b9b",
      placeholder: hexToRGB("#000000", 0.6),
      ...new StaticColorSchemeFactory(accent),
    };
  }
}
export default LightColorSchemeFactory;
