import { MathRenderer } from "./types";
import katex from "katex";

// Chemistry formulas support
import "katex/contrib/mhchem/mhchem";

export const KatexRenderer: MathRenderer = {
  inline: (text, element) => {
    katex.render(text, element, {
      displayMode: false,
      globalGroup: true,
      throwOnError: false,
    });
  },
  block: (text, element) => {
    katex.render(text, element, {
      displayMode: true,
      globalGroup: true,
      throwOnError: false,
    });
  },
};
