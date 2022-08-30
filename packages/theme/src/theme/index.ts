import { getColors, SchemeColors } from "./colorscheme";
import { variants } from "./variants";
import { FontConfig, getFontConfig } from "./font";
import { TransformerFactory, Transformers } from "./transformer";
import { ThemeConfig } from "./types";

export type Theme = {
  breakpoints: string[];
  space: number[] & { small?: number | string };
  sizes: { full: "100%"; half: "50%" };
  radii: {
    none: number;
    default: number;
    dialog: number;
    small: number;
  };
  shadows: { menu: string };
  colors: SchemeColors;
  iconSizes: {
    small: number;
    medium: number;
    big: number;
  };
} & FontConfig &
  typeof variants;

class ThemeFactory {
  transform(type: Transformers, theme: any) {
    const factory = new TransformerFactory();
    return factory.construct(type, theme);
  }

  construct(config: ThemeConfig): Theme {
    const theme: Theme = {
      breakpoints: ["480px", "1000px", "1000px"],
      space: [0, 5, 10, 15, 20, 25, 30, 35],
      sizes: { full: "100%", half: "50%" },
      radii: { none: 0, default: 5, dialog: 10, small: 2.5 },
      iconSizes: { big: 18, medium: 16, small: 14 },
      colors: getColors(config.theme, config.accent),
      shadows:
        config.theme === "dark"
          ? {
              menu: "0px 0px 10px 0px #00000078"
            }
          : {
              menu: "0px 0px 10px 0px #00000022"
            },
      ...getFontConfig(config.scale),
      ...variants
    };
    theme.space.small = 3;
    return theme;
  }
}

export default ThemeFactory;
