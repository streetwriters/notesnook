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
  SchemeColors,
  SchemeColorsAsCSSVariables,
  ThemeDefinition
} from "./theme-engine/types.js";

export * from "./theme/index.js";
export * from "./theme-engine/index.js";
export * from "./theme-engine/types.js";
export * from "./emotion/index.js";

declare global {
  // eslint-disable-next-line no-var
  var DEFAULT_THEME: ThemeDefinition | undefined;
}

declare module "csstype" {
  interface Properties {
    backgroundColor?:
      | Property.BackgroundColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
    color?: Property.Color | SchemeColors | SchemeColorsAsCSSVariables;
    accentColor?:
      | Property.AccentColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;

    borderColor?:
      | Property.BorderColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
    borderBottomColor?:
      | Property.BorderBottomColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
    borderTopColor?:
      | Property.BorderTopColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
    borderLeftColor?:
      | Property.BorderLeftColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
    borderRightColor?:
      | Property.BorderRightColor
      | SchemeColors
      | SchemeColorsAsCSSVariables;
  }
}
