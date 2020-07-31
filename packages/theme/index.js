import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import ThemeFactory from "./theme";
import { injectCss } from "utils/css";
import { isMobile } from "utils/dimensions";

const factory = new ThemeFactory();

function ThemeProvider(props) {
  const { useStore } = props;
  const themeType = useStore((store) => store.theme);
  const accent = useStore((store) => store.accent);
  const theme = factory.construct({
    theme: themeType,
    accent,
    scale: isMobile() ? 0.8 : 1,
  });
  injectCss(factory.transform("css", theme));

  return (
    <EmotionThemeProvider theme={theme}>
      {props.children instanceof Function
        ? props.children(theme)
        : props.children}
    </EmotionThemeProvider>
  );
}
export default ThemeProvider;
