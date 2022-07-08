import { FontSizes, getFontSizes } from "./fontsize";

const SANS_FONT_STACK = [
  `"Open Sans"`,
  `"Noto Sans"`,
  "Frutiger",
  '"Frutiger Linotype"',
  "Univers",
  "Calibri",
  '"Gill Sans"',
  '"Gill Sans MT"',
  '"Myriad Pro"',
  "Myriad",
  '"DejaVu Sans Condensed"',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  "Tahoma",
  "Geneva",
  '"Helvetica Neue"',
  "Helvetica",
  "Arial",
  "-apple-system",
  "BlinkMacSystemFont",
  "sans-serif",
];
const MONOSPACE_FONT_STACK = [
  '"Courier New"',
  "Consolas",
  '"Andale Mono WT"',
  '"Andale Mono"',
  '"Lucida Console"',
  '"Lucida Sans Typewriter"',
  '"DejaVu Sans Mono"',
  '"Bitstream Vera Sans Mono"',
  '"Liberation Mono"',
  '"Nimbus Mono L"',
  "Monaco",
  "Courier",
  "monospace",
];

export type FontConfig = {
  fontSizes: FontSizes;
  fontWeights: {
    normal: number;
    body: number;
    heading: number;
    bold: number;
  };
  fonts: { body: string; monospace: string; heading: string };
};
export function getFontConfig(scale?: number): FontConfig {
  return {
    fontSizes: getFontSizes(scale),
    fontWeights: {
      normal: 400,
      body: 400,
      heading: 600,
      bold: 600,
    },
    fonts: {
      body: SANS_FONT_STACK.join(","),
      monospace: MONOSPACE_FONT_STACK.join(","),
      heading: SANS_FONT_STACK.join(","),
    },
  };
}
