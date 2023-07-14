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

import { ThemeProvider } from "@theme-ui/core";
import {
  ThemeScopes,
  useThemeColors,
  useThemeProvider,
  ScopedThemeProvider as NNScopedThemeProvider,
  ThemeFactory
} from "../";
import { PropsWithChildren, useMemo } from "react";
import { Box, BoxProps } from "@theme-ui/components";

export type EmotionThemeProviderProps = {
  scope?: keyof ThemeScopes;
  injectCssVars?: boolean;
} & Omit<BoxProps, "variant">;

export function EmotionThemeProvider(
  props: PropsWithChildren<EmotionThemeProviderProps>
) {
  const {
    children,
    scope = "base",
    injectCssVars = true,
    className,
    ...restProps
  } = props;
  const { theme } = useThemeProvider();
  const themeScope = useThemeColors(scope);
  const { colors } = themeScope;

  const themeProperties = useMemo(
    () =>
      ThemeFactory.construct({
        scope: colors,
        colorScheme: theme.colorScheme
      }),
    [colors, theme.colorScheme]
  );

  return (
    <ThemeProvider theme={themeProperties}>
      <NNScopedThemeProvider value={themeScope}>
        {injectCssVars ? (
          <Box
            {...restProps}
            className={`${
              className ? className + " " : ""
            }theme-scope-${scope}`}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </NNScopedThemeProvider>
    </ThemeProvider>
  );
}
