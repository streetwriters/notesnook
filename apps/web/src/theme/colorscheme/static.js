import { hexToRGB } from "../../utils/color";

class StaticColorSchemeFactory {
  constructor(accent) {
    return {
      shade: hexToRGB(accent, 0.1),
      dimPrimary: hexToRGB(accent, 0.7),
      fontTertiary: "gray",
      transparent: "transparent",
      static: "white",
      error: "red",
      favorite: "#ffd700"
    };
  }
}
export default StaticColorSchemeFactory;
