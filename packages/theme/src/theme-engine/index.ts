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

export function getPreviewColors(theme: ThemeDefinition) {
  const { base, navigationMenu, statusBar, list, editor } = theme.scopes;
  const { primary, success } = base;

  return {
    navigationMenu: {
      shade: navigationMenu?.primary?.shade || primary.shade,
      accent: navigationMenu?.primary?.accent || primary.accent,
      background: navigationMenu?.primary?.background || primary.background,
      icon: navigationMenu?.primary?.icon || primary.icon
    },
    statusBar: {
      paragraph: statusBar?.primary?.paragraph || primary.paragraph,
      background: statusBar?.primary?.background || primary.background,
      icon: statusBar?.success?.icon || success.icon
    },
    editor: editor?.primary?.background || primary.background,
    list: {
      heading: list?.primary?.heading || primary.heading,
      background: list?.primary?.background || primary.background,
      accent: list?.primary?.accent || primary.accent
    },
    border: primary.border,
    paragraph: primary.paragraph,
    background: primary.background,
    accent: primary.accent
  };
}

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

const ColorNames = [
  "accent",
  "paragraph",
  "background",
  "border",
  "heading",
  "icon",
  "separator",
  "placeholder",
  "hover",
  "shade",
  "backdrop",
  "textSelection"
];

const Variants = [
  "primary",
  "secondary",
  "disabled",
  "selected",
  "error",
  "success"
];
const Scopes = [
  "base",
  "statusBar",
  "list",
  "editor",
  "editorToolbar",
  "dialog",
  "navigationMenu",
  "contextMenu",
  "sheet"
];

const RequiredKeys = [
  "version",
  "id",
  "name",
  "license",
  "authors.0.name",
  "authors.0.email",
  "authors.0.url",
  "description",
  "colorScheme",
  "compatibilityVersion",
  "homepage",
  ...Variants.map((variant) =>
    ColorNames.map((colorName) => `scopes.base.${variant}.${colorName}`)
  ).flat()
];

const flatten = (object: { [name: string]: any }) => {
  const flattenedObject: { [name: string]: any } = {};

  for (const innerObj in object) {
    if (typeof object[innerObj] === "object") {
      if (typeof object[innerObj] === "function") continue;

      const newObject = flatten(object[innerObj]);
      for (const key in newObject) {
        flattenedObject[innerObj + "." + key] = newObject[key];
      }
    } else {
      if (typeof object[innerObj] === "function") continue;
      flattenedObject[innerObj] = object[innerObj];
    }
  }
  return flattenedObject;
};

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/g;
const HEX_COLOR_REGEX_ALPHA =
  /^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$/g;

export function validateTheme(json: ThemeDefinition) {
  const flattenedTheme = flatten(json);
  const missingKeys = [];
  for (const key of RequiredKeys) {
    if (!Object.keys(flattenedTheme).includes(key)) {
      missingKeys.push(key);
    }
  }
  if (missingKeys.length > 0) {
    return {
      error: `Failed to apply theme, ${missingKeys.join(
        ","
      )} are missing from the theme.`
    };
  }
  const invalidColors = [];
  for (const key in flattenedTheme) {
    if (!key.startsWith("scopes")) continue;
    const keyPart = key.split(".").pop() as string;
    const value = flattenedTheme[key];
    const isHexAlphaColor = /hover|shade|backdrop|textSelection/g.test(keyPart);
    HEX_COLOR_REGEX.lastIndex = 0;
    HEX_COLOR_REGEX_ALPHA.lastIndex = 0;

    if (
      (!isHexAlphaColor && !HEX_COLOR_REGEX.test(value)) ||
      (isHexAlphaColor && !HEX_COLOR_REGEX_ALPHA.test(value))
    ) {
      if (!HEX_COLOR_REGEX.test(value)) invalidColors.push(key);
    }
  }
  if (invalidColors.length > 0) {
    return {
      error: `Failed to apply theme, ${invalidColors.join(
        ","
      )} have invalid values.`
    };
  }

  return {
    error: undefined
  };
}
