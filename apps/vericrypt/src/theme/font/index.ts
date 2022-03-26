import { FontSizeFactory } from "./fontsize";

export class FontFactory {
  static construct() {
    return {
      fontSizes: FontSizeFactory.construct(),
      fontWeights: {
        normal: 400,
        body: 400,
        heading: 600,
        bold: 600,
      },
      fonts: {
        body: `Open Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Oxygen-Sans,Ubuntu,Cantarell,sans-serif;`,
        heading: `Open Sans,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Oxygen-Sans,Ubuntu,Cantarell,sans-serif;`,
      },
    };
  }
}
