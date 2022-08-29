import ThemeFactory from "./theme";
import { ThemeConfig } from "./theme/types";
import { injectCss } from "./css";

const factory = new ThemeFactory();

export function useTheme(config: ThemeConfig, inject = true) {
  const { theme, accent, scale = 1 } = config;

  const themeProperties = factory.construct({
    theme,
    accent,
    scale
  });
  if (inject) injectCss(factory.transform("css", themeProperties));

  return themeProperties;
}
