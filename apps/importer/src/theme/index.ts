import ColorSchemeFactory from "./colorscheme";
import VariantsFactory from "./variants";
import { FontFactory } from "./font";
import { Theme } from "theme-ui";

export class ThemeFactory {
  static construct(): Theme {
    return {
      breakpoints: ["480px", "1000px", "1000px"],
      space: [0, 5, 10, 15, 20, 25, 30, 35],
      sizes: { full: "100%", half: "50%" },
      radii: { none: 0, default: 10 },
      colors: {
        modes: {
          dark: ColorSchemeFactory.construct("dark"),
          light: ColorSchemeFactory.construct("light"),
        },
      },
      rawColors: ColorSchemeFactory.construct("light"),
      ...FontFactory.construct(),
      ...new VariantsFactory(),
    };
  }
}
