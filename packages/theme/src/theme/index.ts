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

import { variants } from "./variants";
import { FontConfig, getFontConfig } from "./font";
import { TransformerFactory, Transformers } from "./transformer";
import { ThemeConfig } from "./types";
import { Colors } from "../theme-engine/types";
import { ThemeUIConfig } from "@theme-ui/css/dist/declarations/src/options";

export type Theme = {
  breakpoints: string[];
  space: number[] & { small?: number | string };
  sizes: { full: "100%"; half: "50%" };
  radii: {
    none: number;
    default: number;
    dialog: number;
    small: number;
  };
  shadows: { menu: string };
  colors: Colors;
  iconSizes: {
    small: number;
    medium: number;
    big: number;
  };
  config: ThemeUIConfig;
} & FontConfig &
  typeof variants;

export class ThemeFactory {
  static transform(type: Transformers, theme: Theme) {
    const factory = new TransformerFactory();
    return factory.construct(type, theme);
  }

  static construct(config: ThemeConfig): Theme {
    const theme: Theme = {
      breakpoints: ["480px", "1000px", "1000px"],
      space: [0, 5, 10, 15, 20, 25, 30, 35],
      sizes: { full: "100%", half: "50%" },
      radii: { none: 0, default: 5, dialog: 10, small: 2.5 },
      iconSizes: { big: 18, medium: 16, small: 14 },
      colors: config.colors,
      shadows:
        config.colorScheme === "dark"
          ? {
              menu: "0px 0px 10px 0px #00000078"
            }
          : {
              menu: "0px 0px 10px 0px #00000022"
            },
      config: {
        useCustomProperties: false,
        useRootStyles: false,
        useLocalStorage: false,
        useColorSchemeMediaQuery: false
      },
      ...getFontConfig(),
      ...variants
    };
    theme.space.small = 3;
    return theme;
  }
}
