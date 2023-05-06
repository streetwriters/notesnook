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
  Variants,
  ThemeFactory
} from "../";
import { PropsWithChildren, useMemo } from "react";
import { Box, BoxProps } from "@theme-ui/components";

type ScopedThemeProviderProps = {
  scope?: keyof ThemeScopes;
  variant?: keyof Variants;
  injectCssVars?: boolean;
} & Omit<BoxProps, "variant">;

export function EmotionThemeProvider(
  props: PropsWithChildren<ScopedThemeProviderProps>
) {
  const {
    children,
    scope,
    variant,
    injectCssVars = true,
    className,
    ...restProps
  } = props;
  const { theme } = useThemeProvider();
  const { colors } = useThemeColors(scope);

  const themeProperties = useMemo(
    () =>
      ThemeFactory.construct({
        colors: colors[variant || "primary"],
        colorScheme: theme.colorScheme
      }),
    [colors, theme.colorScheme, variant]
  );

  return (
    <ThemeProvider theme={themeProperties}>
      <NNScopedThemeProvider value={scope || "base"}>
        {injectCssVars ? (
          <Box
            {...restProps}
            className={`${className || ""} theme-scope-${scope || "base"}-${
              variant || "primary"
            }`}
            css={`
              & {
                ${ThemeFactory.transform("css", themeProperties)}
              }
            `}
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
