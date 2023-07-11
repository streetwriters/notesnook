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

// import { ThemeProvider  } from "@emotion/react";
import { PropsWithChildren } from "react";
import {
  EmotionThemeProvider,
  ThemeProvider as NNThemeProvider,
  ThemeScopes,
  Variants
} from "@notesnook/theme";
import { BoxProps } from "@theme-ui/components";
import { useTheme } from "../../toolbar/stores/toolbar-store";

export function ThemeProvider(
  props: PropsWithChildren<
    {
      injectCssVars?: boolean;
      scope?: keyof ThemeScopes;
      variant?: keyof Variants;
    } & Omit<BoxProps, "variant">
  >
) {
  const { children, scope, variant, injectCssVars, ...restProps } = props;
  const theme = useTheme();
  return (
    <NNThemeProvider
      value={{
        theme: theme,
        setTheme: () => {}
      }}
    >
      <EmotionThemeProvider
        scope={scope || "editor"}
        variant={variant || "primary"}
        injectCssVars={injectCssVars}
        {...restProps}
      >
        {children}
      </EmotionThemeProvider>
    </NNThemeProvider>
  );
}
