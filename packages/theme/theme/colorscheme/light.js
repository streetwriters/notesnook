import { hexToRGB } from "utils/color";
import StaticColorSchemeFactory from "./static";

class LightColorSchemeFactory {
  constructor(accent) {
    return {
      primary: accent,
      background: "white",
      accent: "white",
      bgSecondary: "#f0f0f0",
      border: "#f0f0f0",
      hover: "#e0e0e0",
      fontSecondary: "white",
      text: "#000000",
      overlay: "rgba(0, 0, 0, 0.1)",
      secondary: "white",
      icon: "#3b3b3b",
      placeholder: hexToRGB("#000000", 0.6),
      ...new StaticColorSchemeFactory(accent),
    };
  }
}
export default LightColorSchemeFactory;
