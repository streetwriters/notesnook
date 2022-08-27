import { MathRenderer } from "./types";

async function loadKatex() {
  const { default: katex } = await import("katex");
  // Chemistry formulas support
  await import("katex/contrib/mhchem/mhchem");
  return katex;
}

export const KatexRenderer: MathRenderer = {
  inline: (text, element) => {
    loadKatex().then((katex) => {
      katex.render(text, element, {
        displayMode: false,
        globalGroup: true,
        throwOnError: false
      });
    });
  },
  block: (text, element) => {
    loadKatex().then((katex) => {
      katex.render(text, element, {
        displayMode: true,
        globalGroup: true,
        throwOnError: false
      });
    });
  }
};
