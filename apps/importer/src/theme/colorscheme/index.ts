import { DarkColorScheme } from "./dark";
import { LightColorScheme } from "./light";

const colorSchemes = {
  dark: DarkColorScheme,
  light: LightColorScheme,
};

class ColorSchemeFactory {
  static construct<TTheme extends keyof typeof colorSchemes>(theme: TTheme) {
    return colorSchemes[theme].construct("#008837");
  }
}
export default ColorSchemeFactory;
