import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { useStore } from "../../stores/theme-store";
import ThemeFactory from "../../theme";
import { injectCss } from "../../utils/css";

const factory = new ThemeFactory();

function ThemeProvider(props) {
  const themeType = useStore(store => store.theme);
  const accent = useStore(store => store.accent);
  const theme = factory.construct({ theme: themeType, accent, scale: 1 });
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
