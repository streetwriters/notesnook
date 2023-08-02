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
import {
  ThemeDefinition,
  ThemeCompatibilityVersion,
  ThemeScopes,
  VariantsWithStaticColors
} from "./types";
import { create } from "zustand";
import _ThemeLight from "./themes/default-light.json";
import _ThemeDark from "./themes/default-dark.json";
import _ThemePitchBlack from "./themes/default-pitch-black.json";
import { buildVariants } from "./utils";

const ThemeLight = _ThemeLight as ThemeDefinition;
const ThemeDark = _ThemeDark as ThemeDefinition;
const ThemePitchBlack = _ThemePitchBlack as ThemeDefinition;

type ThemeScope = {
  colors: VariantsWithStaticColors<true>;
  scope: keyof ThemeScopes;
  isDark: boolean;
};

type ThemeEngineState = {
  theme: ThemeDefinition;
  setTheme: (theme: ThemeDefinition) => void;
};
const useThemeEngineStore = create<ThemeEngineState>((set) => ({
  theme: ThemeLight,
  setTheme: (theme) => set({ theme })
}));

const ThemeScopeContext = createContext<keyof ThemeScopes>("base");

export function useThemeColors(scope?: keyof ThemeScopes): ThemeScope {
  const currentScope = useCurrentThemeScope();
  const theme = useThemeEngineStore((store) => store.theme);
  const themeScope = useMemo(
    () => theme.scopes[scope || currentScope] || theme.scopes.base,
    [currentScope, scope, theme.scopes]
  );

  const currentTheme = useMemo(
    () => ({
      colors: buildVariants(scope || currentScope || "base", theme, themeScope),
      isDark: theme.colorScheme === "dark",
      scope: currentScope
    }),
    [themeScope, theme, scope, currentScope]
  );

  return currentTheme;
}

export const useCurrentThemeScope = () => useContext(ThemeScopeContext);
export const ScopedThemeProvider = ThemeScopeContext.Provider;
export const THEME_COMPATIBILITY_VERSION: ThemeCompatibilityVersion = 1;
export {
  ThemeLight,
  ThemeDark,
  ThemePitchBlack,
  useThemeEngineStore,
  type ThemeEngineState
};
export { getPreviewColors, themeToCSS } from "./utils";
export { validateTheme } from "./validator";
