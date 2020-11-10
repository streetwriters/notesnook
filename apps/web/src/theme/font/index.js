import FontSizeFactory from "./fontsize";

class FontFactory {
  constructor(scale) {
    return {
      fontSizes: new FontSizeFactory(scale),
      fontWeights: {
        body: 400,
        heading: 600,
        bold: 600,
      },
      fonts: {
        body: "Poppins, sans-serif",
        heading: `Poppins, sans-serif`,
      },
    };
  }
}
export default FontFactory;
