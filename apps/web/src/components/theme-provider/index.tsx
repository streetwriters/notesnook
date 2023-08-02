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
  themeToCSS,
  ThemeScopes,
  useThemeEngineStore
} from "@notesnook/theme";
import { PropsWithChildren, useEffect, useMemo } from "react";
import { BoxProps } from "@theme-ui/components";
import { Global, css } from "@emotion/react";
import { useStore as useThemeStore } from "../../stores/theme-store";

export function BaseThemeProvider(
  props: PropsWithChildren<
    {
      injectCssVars?: boolean;
      addGlobalStyles?: boolean;
      scope?: keyof ThemeScopes;
    } & Omit<BoxProps, "variant">
  >
) {
  const {
    children,
    addGlobalStyles = false,
    scope = "base",
    ...restProps
  } = props;

  const colorScheme = useThemeStore((store) => store.colorScheme);
  const theme = useThemeStore((store) =>
    colorScheme === "dark" ? store.darkTheme : store.lightTheme
  );
  const cssTheme = useMemo(() => themeToCSS(theme), [theme]);

  useEffect(() => {
    (async () => {
      await useThemeStore.getState().init();
    })();
  }, []);

  useEffect(() => {
    useThemeEngineStore.getState().setTheme(theme);
  }, [theme]);

  return (
    <>
      {addGlobalStyles && (
        <Global
          styles={css`
            ${cssTheme}
          `}
        />
      )}

      <EmotionThemeProvider {...restProps} scope={scope}>
        {children}
      </EmotionThemeProvider>
    </>
  );
}

export { EmotionThemeProvider as ScopedThemeProvider };
