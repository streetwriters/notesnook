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

import { createContext, useContext, type ReactNode } from "react";
import {
  EmotionThemeProvider,
  FixedThemeProvider,
  ThemeDark,
  ThemeLight,
  useThemeEngineStore,
  type ThemeDefinition
} from "@notesnook/theme";
import type { ThemeScopeName, ThemeScopeProps } from "../contracts";
import {
  ThemeProvider as KitThemeProvider,
  ThemeScope as KitThemeScope,
  createThemeContext,
  useThemeContext as useKitThemeContext,
  type ThemeContextValue
} from "../shared/theme";

export { createThemeContext, type ThemeContextValue };
export {
  createEditorThemeTokens,
  useEditorThemeTokens,
  type EditorThemeTokens
} from "../shared/editor-theme";

// `display: contents` keeps the element that carries the scope's CSS
// variables out of the layout.
const SCOPE_SX = { display: "contents" } as const;

/**
 * True below a `WebThemeProvider`. Without one (the kit embedded in
 * `apps/web`) the theme is the app's own: the `@notesnook/theme` engine store
 * and the emotion theme `apps/web` already provides.
 */
const Owned = createContext(false);

/** The theme-ui theme (and CSS variables) of one scope of `definition`. */
function ScopeTheme(props: {
  scope: ThemeScopeName;
  definition: ThemeDefinition;
  children?: ReactNode;
}) {
  return (
    <FixedThemeProvider
      scope={props.scope}
      theme={props.definition}
      sx={SCOPE_SX}
    >
      {props.children as never}
    </FixedThemeProvider>
  );
}

export function WebThemeProvider(props: {
  theme: ThemeDefinition;
  children?: ReactNode;
}) {
  return (
    <Owned.Provider value={true}>
      <KitThemeProvider theme={props.theme}>
        <ScopeTheme scope="base" definition={props.theme}>
          {props.children}
        </ScopeTheme>
      </KitThemeProvider>
    </Owned.Provider>
  );
}

export function ThemeScope(props: ThemeScopeProps) {
  const { scope, colorScheme, theme, children } = props;
  const owned = useContext(Owned);
  const parent = useKitThemeContext();
  const engine = useThemeEngineStore((store) => store.theme);
  const fixed =
    theme ??
    (colorScheme === "dark"
      ? ThemeDark
      : colorScheme === "light"
      ? ThemeLight
      : undefined);
  if (!owned && !fixed)
    return (
      <KitThemeScope scope={scope} theme={engine}>
        <EmotionThemeProvider scope={scope} sx={SCOPE_SX}>
          {children as never}
        </EmotionThemeProvider>
      </KitThemeScope>
    );
  const definition = fixed ?? parent.definition;
  return (
    <KitThemeScope scope={scope} theme={definition}>
      <ScopeTheme scope={scope} definition={definition}>
        {children}
      </ScopeTheme>
    </KitThemeScope>
  );
}

export function useThemeContext(): ThemeContextValue {
  const owned = useContext(Owned);
  const context = useKitThemeContext();
  const engine = useThemeEngineStore((store) => store.theme);
  return owned || context.definition === engine
    ? context
    : createThemeContext(engine, context.scope);
}
