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
  ThemeScopeKeys,
  ThemeScopes,
  Variants,
  VariantsWithStaticColors
} from "./types";
import { create } from "zustand";
import { colorsToCss } from "../theme/transformer";
import _ThemeLight from "./themes/default-light.json";
import _ThemeDark from "./themes/default-dark.json";
import _ThemePitchBlack from "./themes/default-pitch-black.json";

const ThemeLight = _ThemeLight as ThemeDefinition;
const ThemeDark = _ThemeDark as ThemeDefinition;
const ThemePitchBlack = _ThemePitchBlack as ThemeDefinition;

type ThemeScope = {
  colors: VariantsWithStaticColors<true>;
  scope: keyof ThemeScopes;
  isDark: boolean;
};

export const StaticColors = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
  black: "#000000",
  white: "#ffffff"
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

export function themeToCSS(theme: ThemeDefinition) {
  const css: string[] = [];
  for (const scopeKey of ThemeScopeKeys) {
    const scope = theme.scopes[scopeKey] || {};
    const variants = buildVariants(scopeKey, theme, scope);

    let scopeCss = `.theme-scope-${scopeKey} {`;
    for (const variantKey in variants) {
      const variant = variants[variantKey as keyof Variants];
      if (!variant) continue;

      css.push(`.theme-scope-${scopeKey}-${variant} {
        ${colorsToCss(variant, variantKey)}
      }`);

      scopeCss += colorsToCss(variant, variantKey);
      scopeCss += "\n\n";
    }
    scopeCss += "}";
    css.push(scopeCss);
  }

  return css.join("\n\n");
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

function buildVariants(
  scope: keyof ThemeScopes,
  theme: ThemeDefinition,
  themeScope: Partial<Variants>
): VariantsWithStaticColors<true> {
  const defaultTheme = theme.colorScheme === "dark" ? ThemeDark : ThemeLight;
  const defaultThemeBase = defaultTheme.scopes.base;
  const defaultThemeScope = (defaultTheme.scopes as any)[scope] || {};
  const variant = {
    ...defaultThemeBase,
    ...defaultThemeScope,
    primary: {
      ...defaultThemeBase.primary,
      ...defaultThemeScope.primary,
      ...theme.scopes.base.primary,
      ...themeScope.primary
    },
    secondary: {
      ...defaultThemeBase.secondary,
      ...defaultThemeScope.secondary,
      ...theme.scopes.base.secondary,
      ...themeScope.secondary
    },
    disabled: {
      ...defaultThemeBase.disabled,
      ...defaultThemeScope.disabled,
      ...theme.scopes.base.disabled,
      ...themeScope.disabled
    },
    error: {
      ...defaultThemeBase.error,
      ...defaultThemeScope.error,
      ...theme.scopes.base.error,
      ...themeScope.error
    },
    success: {
      ...defaultThemeBase.success,
      ...defaultThemeScope.success,
      ...theme.scopes.base.success,
      ...themeScope.success
    },
    selected: {
      ...defaultThemeBase.selected,
      ...defaultThemeScope.selected,
      ...theme.scopes.base.selected,
      ...themeScope.selected
    },
    static: StaticColors
  };

  return variant;
}
