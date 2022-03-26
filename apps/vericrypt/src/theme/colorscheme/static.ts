import { colord } from "colord";

export class StaticColors {
  static construct(accent: string) {
    return {
      shade: colord(accent)
        .alpha(0.1)
        .toRgbString(),
      textSelection: colord(accent)
        .alpha(0.2)
        .toRgbString(),
      dimPrimary: colord(accent)
        .alpha(0.7)
        .toRgbString(),
      transparent: "transparent",
      static: "white",
      error: "#E53935",
      errorBg: "#E5393520",
      success: "#4F8A10",
      warn: "#FF5722",
      favorite: "#ffd700",
      red: "#f44336",
      orange: "#FF9800",
      yellow: "#f0c800",
      green: "#4CAF50",
      blue: "#2196F3",
      purple: "#9568ED",
      gray: "#9E9E9E",
    };
  }
}
