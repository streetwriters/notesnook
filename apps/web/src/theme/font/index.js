import FontSizeFactory from "./fontsize";

class FontFactory {
  constructor(scale) {
    return {
      fontSizes: new FontSizeFactory(scale),
      fontWeights: {
        body: 400,
        heading: 400,
        bold: 400
      },
      fonts: {
        body: "DM Sans, sans-serif",
        heading: `"DM Serif Text", serif`
      }
    };
  }
}
export default FontFactory;
