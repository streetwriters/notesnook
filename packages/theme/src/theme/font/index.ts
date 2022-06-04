import { FontSizes, getFontSizes } from "./fontsize";

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
      body: `Open Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Oxygen-Sans,Ubuntu,Cantarell,sans-serif;`,
      monospace:
        "ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace",
      heading: `Open Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Oxygen-Sans,Ubuntu,Cantarell,sans-serif;`,
    },
  };
}
