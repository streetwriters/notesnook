import DarkColorSchemeFactory from "./dark";
import LightColorSchemeFactory from "./light";

const colorSchemes = {
  dark: DarkColorSchemeFactory,
  light: LightColorSchemeFactory
};

class ColorSchemeFactory {
  constructor(theme, accent) {
    return new colorSchemes[theme](accent);
  }
}
export default ColorSchemeFactory;
