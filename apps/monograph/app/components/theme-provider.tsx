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
  ThemeDark,
  ThemeLight,
  ThemeScopes,
  useThemeEngineStore
} from "@notesnook/theme";
import { PropsWithChildren, useEffect } from "react";
import { BoxProps } from "@theme-ui/components";

export function BaseThemeProvider(
  props: PropsWithChildren<
    {
      injectCssVars?: boolean;
      scope?: keyof ThemeScopes;
      onRender?: () => void;
      colorScheme: "dark" | "light";
    } & Omit<BoxProps, "variant">
  >
) {
  const {
    children,
    scope = "base",
    onRender,
    colorScheme,
    ...restProps
  } = props;

  const theme = colorScheme === "dark" ? ThemeDark : ThemeLight;
  useThemeEngineStore.getState().setTheme(theme);

  // useEffect(() => {
  //   useThemeEngineStore.getState().setTheme(theme);

  //   const themeColorElement = document.head.querySelector(
  //     "meta[name='theme-color']"
  //   );
  //   if (themeColorElement) {
  //     themeColorElement.setAttribute(
  //       "content",
  //       theme.scopes.base.primary.background
  //     );
  //   }

  //   const css = themeToCSS(theme);
  //   const stylesheet = document.getElementById("theme-colors");
  //   if (stylesheet) stylesheet.innerHTML = css;
  // }, [theme]);

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
