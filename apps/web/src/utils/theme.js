import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { ev } from "../common";
import { useEffect } from "react";
import { addCss } from "./css";

const colorsLight = primary =>
  makeTheme({
    primary,
    background: "white",
    accent: "white",
    navbg: "#f0f0f0",
    border: "#f0f0f0",
    hover: "#e0e0e0",
    fontSecondary: "white",
    text: "black",
    overlay: "rgba(255, 255, 255, 0.75)",
    secondary: "white"
  });
const colorsDark = primary =>
  makeTheme({
    primary,
    background: "#1f1f1f",
    accent: "#000",
    navbg: "#2b2b2b",
    border: "#2b2b2b",
    hover: "#3b3b3b",
    fontSecondary: "#000",
    text: "#fff",
    overlay: "rgba(0, 0, 0, 0.75)",
    secondary: "black"
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

const theme = (colors, shadows) => ({
  breakpoints: ["30rem", "62.5rem", "62.5rem"],
  colors: colors,
  space: [0, "0.3125rem", "0.625rem", "0.75rem", "0.9375rem"],
  fontSizes: {
    heading: "2rem",
    input: "0.875rem",
    title: "1rem",
    subtitle: "1rem",
    body: "0.75rem",
    menu: "0.75rem",
    subBody: "0.625rem"
  },
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700
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
      ":hover": {
        cursor: "pointer"
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
    links: {
      variant: "buttons.primary",
      bg: "transparent",
      color: "primary",
      fontSize: "subBody",
      fontFamily: "body",
      py: 0,
      px: 0,
      my: 0,
      mx: 0
    }
  },
  shadows: shadows
});

function makeTheme({
  primary,
  background,
  accent,
  navbg,
  border,
  hover,
  fontSecondary,
  text,
  overlay,
  secondary
}) {
  return {
    background,
    primary,
    shade: hexToRGB(primary, 0.1),
    //secondary: "",
    accent,
    //custom
    navbg,
    border,
    hover,
    fontSecondary,
    fontTertiary: "gray",
    transparent: "transparent",
    text,
    overlay,
    static: "white",
    secondary
  };
}

const getTheme = (type, accent) =>
  type === "dark"
    ? theme(colorsDark(accent), shadowsDark)
    : theme(colorsLight(accent), shadowsLight);

var currentTheme = window.localStorage.getItem("theme") || "light";
var currentAccent = window.localStorage.getItem("accent") || "#1790F3";

export const ThemeProvider = props => {
  const [, updateState] = React.useState();
  useEffect(() => {
    function updater() {
      updateState({});
    }
    ev.addListener("changeTheme", updater);
    return () => {
      ev.removeListener("changeTheme", updater);
    };
  }, []);
  const theme = getTheme(currentTheme, currentAccent);
  addCss(cssTheme(theme));
  return (
    <EmotionThemeProvider theme={theme}>
      {props.children instanceof Function
        ? props.children(theme)
        : props.children}
    </EmotionThemeProvider>
  );
};

export const changeAccent = accent => {
  currentAccent = accent;
  window.localStorage.setItem("accent", accent);
  ev.emit("changeTheme");
};

export const changeTheme = () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  window.localStorage.setItem("theme", currentTheme);
  ev.emit("changeTheme");
};

export const isDarkTheme = () => currentTheme === "dark";

export const ButtonPressedStyle = {
  ":active": {
    opacity: "0.8"
  }
};

const cssTheme = theme => {
  let root = ":root {";
  for (let color in theme.colors) {
    root += `--${color}: ${theme.colors[color]};`;
  }
  return root + "}";
};

const hexToRGB = (hex, alpha = 1) => {
  let parseString = hex;
  if (hex.startsWith("#")) {
    parseString = hex.slice(1, 7);
  }
  if (parseString.length !== 6) {
    return null;
  }
  const r = parseInt(parseString.slice(0, 2), 16);
  const g = parseInt(parseString.slice(2, 4), 16);
  const b = parseInt(parseString.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
