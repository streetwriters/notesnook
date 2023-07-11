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
  Colors,
  ThemeVariantProvider,
  Variants,
  useCurrentThemeScope,
  useThemeVariant
} from "../";
import { PropsWithChildren } from "react";
import { Box, BoxProps } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/core";

type ThemeVariantProps = {
  variant: keyof Variants;
  injectCssVars?: boolean;
} & Omit<BoxProps, "variant">;
export function EmotionThemeVariant(
  props: PropsWithChildren<ThemeVariantProps>
) {
  const {
    variant,
    injectCssVars = false,
    children,
    className,
    ...restProps
  } = props;
  const { colors, scope } = useCurrentThemeScope();
  const parentVariant = useThemeVariant();

  // no need to nest same variant providers
  if (parentVariant === variant) return <>{children}</>;

  const variantColors: Colors = {
    ...colors[variant],
    ...colors.static
  };
  return (
    <ThemeProvider theme={{ colors: variantColors }}>
      <ThemeVariantProvider value={variant}>
        {injectCssVars ? (
          <Box
            {...restProps}
            className={`${
              className + " " || ""
            }theme-scope-${scope}-${variant}`}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </ThemeVariantProvider>
    </ThemeProvider>
  );
}
