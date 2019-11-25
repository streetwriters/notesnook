export default {
  breakpoints: ["40em", "52em", "64em"],
  colors: {
    primary: "white",
    accent: "#1790F3",
    navbg: "#f0f0f0",
    transparent: "#00000000",
    //font related
    fontPrimary: "black",
    fontSecondary: "white"
  },
  //fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
  fontSizes: {
    heading: 42,
    body: 14
  },
  fontWeights: {
    body: 500,
    heading: 700,
    bold: 700
  },
  fonts: {
    body: "Quicksand, sans-serif",
    heading: "Quicksand, sans-serif"
  },
  sizes: {
    full: "100%"
  },
  radii: {
    none: 0,
    default: 5
  },
  buttons: {
    nav: {
      color: "fontPrimary",
      bg: "transparent",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      }
    }
  }
};
