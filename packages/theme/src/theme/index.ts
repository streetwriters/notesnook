import { getColors, SchemeColors } from "./colorscheme";
import { getVariants } from "./variants";
import { FontConfig, getFontConfig } from "./font";
import { TransformerFactory, Transformers } from "./transformer";
import { ThemeConfig } from "./types";

export type Theme = {
  breakpoints: string[];
  space: number[];
  sizes: Record<string, string>;
  radii: Record<string, number>;
  shadows: Record<string, string>;
  colors: SchemeColors;
} & FontConfig;

class ThemeFactory {
  transform(type: Transformers, theme: any) {
    const factory = new TransformerFactory();
    return factory.construct(type, theme);
  }

  construct(config: ThemeConfig): Theme {
    return {
      breakpoints: ["480px", "1000px", "1000px"],
      space: [0, 5, 10, 15, 20, 25, 30, 35],
      sizes: { full: "100%", half: "50%" },
      radii: { none: 0, default: 5, dialog: 10, small: 2.5 },
      shadows:
        config.theme === "dark"
          ? {
              menu: "0px 0px 10px 0px #00000078",
            }
          : {
              menu: "0px 0px 10px 0px #00000022",
            },
      colors: getColors(config.theme, config.accent),
      ...getFontConfig(config.scale),
      ...getVariants(),
    };
  }
}

export default ThemeFactory;
