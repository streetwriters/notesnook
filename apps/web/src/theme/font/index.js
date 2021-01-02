import FontSizeFactory from "./fontsize";

class FontFactory {
  constructor(scale) {
    return {
      fontSizes: new FontSizeFactory(scale),
      fontWeights: {
        body: 400,
        heading: 700,
        bold: 700,
      },
      fonts: {
        body: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;`,
        heading: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;`,
      },
    };
  }
}
export default FontFactory;
