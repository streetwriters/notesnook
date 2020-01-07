export const ButtonPressedStyle = {
  ":active": {
    opacity: "0.8"
  }
};
const colorsLight = makeTheme({
  background: "white",
  accent: "white",
  navbg: "#f0f0f0",
  border: "#f0f0f0",
  hover: "#e0e0e0",
  fontSecondary: "white",
  fontTertiary: "gray",
  text: "black",
  overlay: "rgba(255, 255, 255, 0.75)"
});
const colorsDark = makeTheme({
  background: "#1f1f1f",
  accent: "#000",
  navbg: "#2b2b2b",
  border: "#2b2b2b",
  hover: "#3b3b3b",
  fontSecondary: "#000",
  text: "#fff",
  overlay: "rgba(0, 0, 0, 0.75)"
});
const shadowsDark = {
  1: "0 0 0px 0px #00000000",
  2: "0 0 8px 0px #55555544",
  3: "0 0 20px 0px #55555599"
};
const shadowsLight = {
  1: "0 0 20px 0px #1790F3aa",
  2: "0 0 8px 0px #00000047",
  3: "0 0 20px 0px #aaaaaa77",
  4: "0 0 5px 0px #00000017"
};

export default {
  breakpoints: ["480px", "834px", "1200px"],
  colors: colorsLight,
  space: [0, 5, 10, 12, 15],
  fontSizes: {
    heading: 36,
    input: 16,
    title: 18,
    subtitle: 18,
    body: 14,
    menu: 14
  },
  fontWeights: {
    body: 400,
    heading: 800,
    bold: 800
  },
  fonts: {
    body: "Noto Sans, sans-serif",
    heading: "Noto Serif, serif"
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
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      fontSizes: "input",
      ":focus": {
        outline: "none",
        borderColor: "primary"
      },
      ":hover": {
        borderColor: "hover"
      }
    },
    search: {
      variant: "forms.default",
      ":focus": {
        outline: "none",
        boxShadow: 4
      }
    }
  },
  text: {
    heading: {
      fontFamily: "heading",
      fontWeight: "heading",
      fontSize: "heading",
      color: "text"
    },
    title: {
      fontFamily: "heading",
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
    primary: {
      color: "fontSecondary",
      bg: "primary",
      borderRadius: "default",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      },
      ...ButtonPressedStyle
    },
    secondary: {
      variant: "buttons.primary",
      color: "text",
      bg: "navbg",
      ...ButtonPressedStyle
    },
    tertiary: {
      variant: "buttons.primary",
      color: "text",
      bg: "transparent",
      border: "2px solid",
      borderColor: "border",
      ":active": {
        color: "primary",
        opacity: 0.8
      }
    },
    nav: {
      bg: "transparent",
      fontFamily: "body",
      fontWeight: "body",
      ":focus": {
        outline: "none"
      }
    },
    setting:{
      bg:'transparent',
      borderLeft:'0px Solid',
      borderRight:'0px Solid',
      borderTop:'0px Solid',
      borderBottom:'1px Solid',
      borderColor:'border',
      color:'text',
      textAlign:'left',
      fontSize:'title',
      fontFamily:'body',
      py:'15px',
      mx:'5px'
    }
  },
  shadows: shadowsLight
};

function makeTheme({
  background,
  accent,
  navbg,
  border,
  hover,
  fontSecondary,
  fontTertiary,
  text,
  overlay
}) {
  return {
    background,
    primary: "#1790F3",
    //secondary: "",
    accent,
    //custom
    navbg,
    border,
    hover,
    fontSecondary,
    fontTertiary,
    transparent: "#00000000",
    text,
    overlay
  };
}
