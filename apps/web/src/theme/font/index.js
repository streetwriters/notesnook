import FontSizeFactory from "./fontsize";

class FontFactory {
  constructor(scale) {
    return {
      fontSizes: new FontSizeFactory(scale),
      fontWeights: {
        body: 400,
        bold: 700
      },
      fonts: {
        body: "Noto Sans JP, sans-serif",
        heading: "Noto Serif, serif"
      }
    };
  }
}
export default FontFactory;
