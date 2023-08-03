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
  useThemeEngineStore,
  ScopedThemeProvider as NNScopedThemeProvider,
  ThemeFactory
} from "../";
import React, { ForwardedRef, PropsWithChildren, useMemo } from "react";
import { Box, BoxProps } from "@theme-ui/components";
import { useTheme } from "@emotion/react";

export type EmotionThemeProviderProps = {
  scope?: keyof ThemeScopes;
  injectCssVars?: boolean;
} & Omit<BoxProps, "variant" | "ref">;

function _EmotionThemeProvider(
  props: PropsWithChildren<EmotionThemeProviderProps>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const {
    children,
    scope = "base",
    injectCssVars = true,
    className,
    ...restProps
  } = props;
  const emotionTheme = useTheme();
  const theme = useThemeEngineStore((store) => store.theme);
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
    <ThemeProvider
      theme={{
        ...(emotionTheme || themeProperties),
        colors: themeProperties.colors
      }}
    >
      <NNScopedThemeProvider value={scope}>
        {injectCssVars ? (
          <Box
            {...restProps}
            ref={forwardedRef}
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

export const EmotionThemeProvider = React.forwardRef<
  HTMLDivElement,
  EmotionThemeProviderProps
>(_EmotionThemeProvider);
