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
import * as CSS from "csstype";

export type ThemeColor =
  | keyof Colors
  | `${keyof Colors}-${keyof Omit<Variants, "primary">}`;
export type SchemeColors = ThemeColor | CSS.Property.Color;
export type SchemeColorsAsCSSVariables = `var(--${ThemeColor})`;

export function isThemeColor(
  color: string,
  colors: Colors
): color is keyof Colors {
  return color in colors;
}
export type ThemeCompatibilityVersion = 1;

/**
 * @title Notesnook Theme schema
 * @description This is a schema for validation of Notesnook themes.
 */
export type ThemeDefinition = {
  /**
   * Name of the theme
   */
  name: string;
  /**
   * ID of the theme. Must be unique across all other themes.
   */
  id: string;
  /**
   * Version of the theme.
   */
  version: number;
  /**
   * The compatibility version of the theme used by the client to
   * decide whether the theme is compatible with the current app version.
   */
  compatibilityVersion: ThemeCompatibilityVersion;
  /**
   * The license under which the theme can be shared, modified etc.
   *
   * @examples ["GPL-3.0-or-later", "Apache-2.0", "BSD-3-Clause", "MIT", "MPL-2.0"]
   */
  license: string;
  /**
   * Author(s) of the theme.
   */
  authors: ThemeAuthor[];
  /**
   * Website or homepage of the theme.
   *
   * @format uri
   */
  homepage: string;
  /**
   * A short description of the theme.
   */
  description: string;
  /**
   * Whether the theme has a dark color scheme or light.
   */
  colorScheme: "light" | "dark";
  /**
   * Keywords to help categorize the theme & improve search results.
   */
  tags?: string[];
  /**
   * All the theme scopes.
   */
  scopes: ThemeScopes;

  codeBlockCSS: string;
};

export type ThemeAuthor = {
  /**
   * Name of the author.
   */
  name: string;
  /**
   * Contact email of the author.
   */
  email?: string;
  /**
   * Website or support page of the author.
   */
  url?: string;
};

export type ThemeScopes = {
  /**
   * Base theme scope is the only scope that must be 100% specified.
   * There are no optional variants or colors in this scope and it
   * acts as a fallback for all the other scopes in case a color or
   * variant is missing in them.
   */
  base: Variants<true>;
  /**
   * Scope for the status bar on Desktop & mobile. On mobile, the status
   * bar can be found at the bottom of the side navigation menu which
   * includes the sync status, logged in status etc.
   */
  statusBar?: Partial<Variants>;
  /**
   * Scope for the central list view containing your notes, notebooks, tags etc.
   */
  list?: Partial<Variants>;
  /**
   * Scope for everything inside the editor excluding the toolbar which has its
   * own scope.
   */
  editor?: Partial<Variants>;
  /**
   * Scope specific to the Editor Toolbar.
   */
  editorToolbar?: Partial<Variants>;
  /**
   * Scope for all the dialogs in the app.
   */
  dialog?: Partial<Variants>;
  /**
   * Scope for the side navigation menu.
   */
  navigationMenu?: Partial<Variants>;
  /**
   * Scope for all the context menus in the app. This is desktop/web only since
   * the mobile clients do not have context menus.
   */
  contextMenu?: Partial<Variants>;
  /**
   * Scope for all the bottom sheets shown in the app. This scope only applies
   * on the mobile clients & the mobile version of the web app.
   */
  sheet?: Partial<Variants>;
};

export type Variants<TRequired extends boolean = false> = {
  primary: TRequired extends true ? Colors : Partial<Colors>;
  secondary: TRequired extends true ? Colors : Partial<Colors>;
  disabled: TRequired extends true ? Colors : Partial<Colors>;
  // selected: TRequired extends true ? Colors : Partial<Colors>;
  error: TRequired extends true ? Colors : Partial<Colors>;
  success: TRequired extends true ? Colors : Partial<Colors>;
};

export type Colors = {
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  accent: string;
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  paragraph: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  background: string;
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  border: string;
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  heading: string;
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  icon: string;
  /**
   * Only Hex RGB values are supported. No Alpha. (e.g. #f33ff3)
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  separator: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  placeholder: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  hover: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  shade: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  backdrop: string;
  /**
   * Hex RGB & ARGB values both are supported. (e.g. #dbdbdb99)
   * @pattern ^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$
   */
  textSelection: string;
};

export type VariantsWithStaticColors<TRequired extends boolean = false> =
  Variants<TRequired> & {
    static: {
      red: string;
      orange: string;
      yellow: string;
      green: string;
      blue: string;
      purple: string;
      gray: string;
      black: string;
      white: string;
    };
  };

export const ThemeScopeKeys = [
  "base",
  "statusBar",
  "list",
  "editor",
  "dialog",
  "navigationMenu",
  "contextMenu",
  "editorToolbar",
  "sheet"
] as const;
