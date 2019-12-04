export const SHADOW = "0 0 8px 0px #aaaaaa44";
export const DIALOG_SHADOW = "0 0 20px 0px #aaaaaa77";
export const ButtonPressedStyle = {
  ":active": {
    opacity: "0.8"
  }
};
export default {
  breakpoints: ["480px", "834px", "1200px"],
  colors: {
    primary: "white",
    accent: "#1790F3",
    navbg: "#f0f0f0",
    transparent: "#00000000",
    //font related
    fontPrimary: "black",
    fontSecondary: "white",
    border: "#f0f0f0",
    hover: "#e0e0e0"
  },
  space: [0, 5, 10, 12],
  fontSizes: {
    heading: 36,
    input: 16,
    title: 22,
    subtitle: 18,
    body: 14,
    menu: 14
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
  forms: {
    default: {
      borderWidth: 0,
      borderRadius: "default",
      bg: "primary",
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      fontSizes: "input",
      ":focus": {
        outline: "none",
        borderColor: "accent"
      },
      ":hover": {
        borderColor: "hover"
      }
    },
    search: {
      borderWidth: 0,
      borderRadius: "default",
      bg: "primary",
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      fontSizes: "input",
      ":focus": {
        outline: "none",
        boxShadow: SHADOW
      },
      ":hover": {
        borderColor: "hover"
      }
    }
  },
  text: {
    heading: {
      fontFamily: "body",
      fontWeight: "heading",
      fontSize: "heading"
    },
    title: {
      fontFamily: "body",
      fontWeight: "bold",
      fontSize: "title"
    },
    body: {
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "body"
    }
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
    },
    primary: {
      color: "fontSecondary",
      bg: "accent",
      borderRadius: "default",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      },
      ...ButtonPressedStyle
    },
    secondary: {
      color: "fontPrimary",
      bg: "navbg",
      borderRadius: "default",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      },
      ...ButtonPressedStyle
    },
    tertiary: {
      color: "fontPrimary",
      bg: "transparent",
      borderRadius: "default",
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      },
      ":active": {
        color: "accent",
        opacity: 0.8
      }
    }
  }
};
