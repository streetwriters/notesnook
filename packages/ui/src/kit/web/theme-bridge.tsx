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

import { useLayoutEffect, type ComponentProps, type ReactNode } from "react";
import {
  EmotionThemeProvider,
  useThemeEngineStore,
  type ThemeDefinition
} from "@notesnook/theme";
import type { ThemeScopeName } from "../contracts";
import { useThemeContext } from "./theme";

/**
 * Points the `@notesnook/theme` engine store (which the emotion-based editor
 * UI reads) at a `@ui` theme definition. Does nothing when it already matches.
 */
export function syncThemeEngine(definition: ThemeDefinition) {
  const state = useThemeEngineStore.getState();
  if (state.theme !== definition) state.setTheme(definition);
}

/**
 * Bridges the `@ui` theme (`WebThemeProvider`/`ThemeScope`) to the
 * `@notesnook/theme` emotion theme used by `packages/editor`. Whatever theme
 * the surrounding `@ui` provider holds drives the emotion theme, and changes
 * to it are applied before the next paint.
 */
export function ThemeBridge(props: {
  scope?: ThemeScopeName;
  children?: ReactNode;
  sx?: ComponentProps<typeof EmotionThemeProvider>["sx"];
}) {
  const { definition } = useThemeContext();
  useLayoutEffect(() => syncThemeEngine(definition), [definition]);
  return (
    <EmotionThemeProvider
      injectCssVars={false}
      scope={props.scope}
      sx={props.sx}
    >
      {
        props.children as ComponentProps<
          typeof EmotionThemeProvider
        >["children"]
      }
    </EmotionThemeProvider>
  );
}
