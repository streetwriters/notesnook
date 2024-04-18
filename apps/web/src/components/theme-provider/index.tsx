/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import {
  EmotionThemeProvider,
  ThemeScopes,
  themeToCSS,
  useThemeEngineStore
} from "@notesnook/theme";
import { PropsWithChildren, useEffect } from "react";
import { BoxProps } from "@theme-ui/components";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useSystemTheme } from "../../hooks/use-system-theme";

export function BaseThemeProvider(
  props: PropsWithChildren<
    {
      injectCssVars?: boolean;
      scope?: keyof ThemeScopes;
      onRender?: () => void;
    } & Omit<BoxProps, "variant">
  >
) {
  const { children, scope = "base", onRender, ...restProps } = props;

  const colorScheme = useThemeStore((store) => store.colorScheme);
  const theme = useThemeStore((store) =>
    colorScheme === "dark" ? store.darkTheme : store.lightTheme
  );
  // const cssTheme = useMemo(() => themeToCSS(theme), [theme]);
  const isSystemThemeDark = useSystemTheme();
  const setColorScheme = useThemeStore((store) => store.setColorScheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);

  useEffect(() => {
    if (!followSystemTheme) return;
    setColorScheme(isSystemThemeDark ? "dark" : "light");
  }, [isSystemThemeDark, followSystemTheme, setColorScheme]);

  useEffect(() => {
    if (IS_THEME_BUILDER) return;
    (async () => {
      await useThemeStore.getState().init();
    })();
  }, []);

  useEffect(() => {
    useThemeEngineStore.getState().setTheme(theme);

    const themeColorElement = document.head.querySelector(
      "meta[name='theme-color']"
    );
    if (themeColorElement) {
      themeColorElement.setAttribute(
        "content",
        theme.scopes.base.primary.background
      );
    }

    const css = themeToCSS(theme);
    const stylesheet = document.getElementById("theme-colors");
    if (stylesheet) stylesheet.innerHTML = css;
  }, [theme]);

  useEffect(() => {
    onRender?.();
  }, [onRender]);

  return (
    <>
      <EmotionThemeProvider {...restProps} scope={scope}>
        {children}
      </EmotionThemeProvider>
    </>
  );
}

export { EmotionThemeProvider as ScopedThemeProvider };
