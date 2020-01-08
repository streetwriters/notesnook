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
  breakpoints: ["480px", "834px", "1200px"],
  colors: colors,
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
    setting: {
      bg: "transparent",
      borderLeft: "0px Solid",
      borderRight: "0px Solid",
      borderTop: "0px Solid",
      borderBottom: "1px Solid",
      borderColor: "border",
      color: "text",
      textAlign: "left",
      fontSize: "title",
      fontFamily: "body",
      borderRadius: "0px",
      py: "15px",
      mx: "5px",
      "&:hover": { borderColor: "primary" }
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
    shade: primary + "10",
    //secondary: "",
    accent,
    //custom
    navbg,
    border,
    hover,
    fontSecondary,
    fontTertiary: "gray",
    transparent: "#00000000",
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
