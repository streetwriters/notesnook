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

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getThemeScope,
  ThemeFactory,
  ThemeLight,
  type Theme,
  type ThemeDefinition
} from "@notesnook/theme";
import type { ThemeScopeName, ThemeScopeProps } from "../../../ui";

export interface ThemeContextValue {
  definition: ThemeDefinition;
  scope: ThemeScopeName;
  theme: Theme;
  colors: Record<string, string>;
  key: object;
}

const scopeCache = new WeakMap<
  ThemeDefinition,
  Map<string, ThemeContextValue>
>();

export function createThemeContext(
  definition: ThemeDefinition,
  scope: ThemeScopeName
): ThemeContextValue {
  let scopes = scopeCache.get(definition);
  if (!scopes) scopeCache.set(definition, (scopes = new Map()));
  let value = scopes.get(scope);
  if (!value) {
    const theme = ThemeFactory.construct({
      scope: getThemeScope(scope, definition).colors,
      colorScheme: definition.colorScheme
    });
    value = {
      definition,
      scope,
      theme,
      colors: theme.colors as Record<string, string>,
      key: {}
    };
    scopes.set(scope, value);
  }
  return value;
}

const ThemeContext = createContext<ThemeContextValue>(
  createThemeContext(ThemeLight, "base")
);

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function DesktopThemeProvider(props: {
  theme: ThemeDefinition;
  children?: ReactNode;
}) {
  const value = useMemo(
    () => createThemeContext(props.theme, "base"),
    [props.theme]
  );
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function ThemeScope({ scope, children }: ThemeScopeProps) {
  const parent = useThemeContext();
  const value = useMemo(
    () => createThemeContext(parent.definition, scope),
    [parent.definition, scope]
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
