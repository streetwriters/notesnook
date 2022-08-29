import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { PropsWithChildren } from "react";
import { useTheme } from "../../toolbar/stores/toolbar-store";

export function ThemeProvider(props: PropsWithChildren<unknown>) {
  const theme = useTheme();
  return (
    <EmotionThemeProvider theme={theme || {}}>
      {props.children}
    </EmotionThemeProvider>
  );
}
