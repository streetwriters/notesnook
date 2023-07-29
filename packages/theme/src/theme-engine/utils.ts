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
  PreviewColors,
  StaticColors,
  ThemeDefinition,
  ThemeScopeKeys,
  ThemeScopes,
  Variants,
  VariantsWithStaticColors
} from "./types";
import _ThemeLight from "./themes/default-light.json";
import _ThemeDark from "./themes/default-dark.json";

const ThemeLight = _ThemeLight as ThemeDefinition;
const ThemeDark = _ThemeDark as ThemeDefinition;

export function getPreviewColors(theme: ThemeDefinition): PreviewColors {
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
          ${colorsToCSSVariables(variant, variantKey)}
        }`);

      scopeCss += colorsToCSSVariables(variant, variantKey);
      scopeCss += "\n\n";
    }
    scopeCss += "}";
    css.push(scopeCss);
  }

  return css.join("\n\n");
}

export function buildVariants(
  scope: keyof ThemeScopes,
  theme: ThemeDefinition,
  themeScope: Partial<Variants>
): VariantsWithStaticColors<true> {
  const defaultTheme = theme.colorScheme === "dark" ? ThemeDark : ThemeLight;
  const defaultThemeBase = defaultTheme.scopes.base;
  const defaultThemeScope = defaultTheme.scopes[scope] || {};
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

export function colorsToCSSVariables(colors: Colors, variantKey?: string) {
  let root = "";
  const suffix =
    !variantKey || variantKey === "primary" ? "" : `-${variantKey}`;
  for (const color in colors) {
    root += `--${color}${suffix}: ${colors[color as keyof Colors]};\n`;
  }
  return root;
}
