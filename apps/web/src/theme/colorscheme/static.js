import { hexToRGB } from "../../utils/color";

class StaticColorSchemeFactory {
  constructor(accent) {
    return {
      shade: hexToRGB(accent, 0.1),
      dimPrimary: hexToRGB(accent, 0.7),
      fontTertiary: "gray",
      transparent: "transparent",
      static: "white",
      error: "#E53935",
      success: "#4F8A10",
      favorite: "#ffd700",
    };
  }
}
export default StaticColorSchemeFactory;
