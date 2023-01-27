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

import { createContext, useContext, useMemo } from "react";
import { ThemeLight } from "./themes/light";
import { Theme, ColorsType, ThemeScopes } from "./types";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: ThemeLight,
  setTheme: () => null
});
const ThemeScope = createContext<keyof ThemeScopes>("base");
const useCurrentThemeScope = () => useContext(ThemeScope);

export const useTheme = (scope?: keyof ThemeScopes): ColorsType => {
  const currentScope = useCurrentThemeScope();
  const { theme } = useThemeProvider();
  const themeScope = useMemo(
    () => theme.scopes[scope || currentScope] || theme.scopes.base,
    [currentScope, scope, theme.scopes]
  );

  const currentTheme = useMemo(
    () => ({
      primary: {
        ...theme.scopes.base.primary,
        ...themeScope.primary
      },
      secondary: {
        ...theme.scopes.base.secondary,
        ...themeScope.secondary
      },
      disabled: {
        ...theme.scopes.base.disabled,
        ...themeScope.disabled
      },
      error: {
        ...theme.scopes.base.error,
        ...themeScope.error
      },
      warning: {
        ...theme.scopes.base.warning,
        ...themeScope.warning
      },
      success: {
        ...theme.scopes.base.success,
        ...themeScope.success
      },
      static: {
        red: "#f44336",
        orange: "#FF9800",
        yellow: "#FFD600",
        green: "#4CAF50",
        blue: "#2196F3",
        purple: "#673AB7",
        gray: "#9E9E9E",
        black: "#000000",
        white: "#000000"
      },
      isDark: theme.colorScheme === "dark"
    }),
    [themeScope, theme]
  );

  return currentTheme;
};

export const useThemeProvider = () => useContext(ThemeContext);
export const ThemeProvider = ThemeContext.Provider;
export const ScopedThemeProvider = ThemeScope.Provider;
