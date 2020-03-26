import React from "react";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { useStore } from "../../stores/theme-store";
import ThemeFactory from "../../theme";
import { injectCss } from "../../utils/css";

function ThemeProvider(props) {
  const theme = useStore(store => store.theme);
  const accent = useStore(store => store.accent);
  const factory = new ThemeFactory({ theme, accent, scale: 1 });
  injectCss(factory.transform("css"));
  return (
    <EmotionThemeProvider theme={factory}>
      {props.children}
    </EmotionThemeProvider>
  );
}
export default ThemeProvider;
