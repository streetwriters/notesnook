import ColorSchemeFactory from "./colorscheme";
import VariantsFactory from "./variants";
import FontFactory from "./font";
import TransformerFactory from "./transformer";

class ThemeFactory {
  transform(type) {
    return new TransformerFactory(type, this);
  }

  construct(config) {
    return {
      breakpoints: ["480px", "1000px", "1000px"],
      space: [0, 5, 10, 15, 20, 25, 30, 35],
      sizes: { full: "100%", half: "50%" },
      radii: { none: 0, default: 5 },
      colors: new ColorSchemeFactory(config.theme, config.accent),
      ...new FontFactory(config.scale),
      ...new VariantsFactory()
    };
  }
}

export default ThemeFactory;
