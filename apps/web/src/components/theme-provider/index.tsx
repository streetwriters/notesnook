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

import { ThemeProvider as EmotionThemeProvider } from "@theme-ui/core";
import {
  ThemeProvider,
  ThemeDracula,
  ThemeLight,
  ThemeScopes,
  useThemeColors,
  ThemeFactory,
  useThemeProvider,
  ScopedThemeProvider as NNScopedThemeProvider,
  useCurrentThemeScope,
  Variants
} from "@notesnook/theme";
import { PropsWithChildren, useMemo } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { Box, BoxProps } from "@theme-ui/components";

const factory = new ThemeFactory();

export function BaseThemeProvider(
  props: PropsWithChildren<
    { injectCssVars?: boolean } & Omit<BoxProps, "variant">
  >
) {
  const { children, ...restProps } = props;
  const [theme, setTheme] = usePersistentState("settings:theme", ThemeDracula);

  return (
    <ThemeProvider
      value={{
        theme: ThemeDracula,
        setTheme
      }}
    >
      <ScopedThemeProvider scope="base" {...restProps}>
        {children}
      </ScopedThemeProvider>
    </ThemeProvider>
  );
}

type ScopedThemeProviderProps = {
  scope?: keyof ThemeScopes;
  variant?: keyof Variants;
  injectCssVars?: boolean;
} & Omit<BoxProps, "variant">;

export function ScopedThemeProvider(
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
      factory.construct({
        colors: colors[variant || "primary"],
        colorScheme: theme.colorScheme
      }),
    [colors, theme.colorScheme, variant]
  );

  return (
    <EmotionThemeProvider theme={themeProperties}>
      <NNScopedThemeProvider value={scope || "base"}>
        {injectCssVars ? (
          <Box
            {...restProps}
            className={`${className} theme-scope-${scope || "base"}-${
              variant || "primary"
            }`}
            css={`
              & {
                ${factory.transform("css", themeProperties)}
              }
            `}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </NNScopedThemeProvider>
    </EmotionThemeProvider>
  );
}

type ThemeVariantProps = { variant: keyof Variants; injectCssVars?: boolean };
export function ThemeVariant(props: PropsWithChildren<ThemeVariantProps>) {
  const { variant, injectCssVars = false, children } = props;
  const scope = useCurrentThemeScope();

  return (
    <ScopedThemeProvider
      scope={scope}
      variant={variant}
      injectCssVars={injectCssVars}
    >
      {children}
    </ScopedThemeProvider>
  );
}
