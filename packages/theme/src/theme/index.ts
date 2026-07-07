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

import { variants } from "./variants/index.js";
import { FontConfig, getFontConfig } from "./font/index.js";
import { ThemeConfig } from "./types.js";
import { ThemeColor, VariantsWithStaticColors } from "../theme-engine/types.js";
import { Theme as ThemeUITheme } from "@theme-ui/css";

export { createButtonVariant } from "./variants/button.js";
export { getFontConfig } from "./font/index.js";
export type Theme = {
  breakpoints: string[];
  space: (number | string)[] & {
    small?: number | string;
    spacing1: number;
    spacing2: number;
    spacing3: number;
    spacing4: number;
    spacing5: number;
    spacing6: number;
    spacing7: number;
    spacing8: number;
    spacing9: number;
    spacing10: number;
    spacing11: number;
    spacing12: number;
    spacing13: number;
  };
  sizes: { full: "100%"; half: "50%" };
  radii: {
    none: number;
    default: number;
    dialog: number;
    large: number;
    small: number;
    radius1: number;
    radius2: number;
    radius3: number;
    radius4: number;
    radius5: number;
    radius6: number;
    radius7: number;
    radius8: number;
    radius9: number;
  };
  shadows: { menu: string };
  colors: Record<ThemeColor, string>;
  iconSizes: {
    small: number;
    medium: number;
    big: number;
  };
  config: ThemeUITheme["config"];
} & FontConfig &
  typeof variants;

export class ThemeFactory {
  static construct(config: ThemeConfig): Theme {
    const theme: Theme = {
      breakpoints: ["480px", "1000px", "1000px"],
      space: Object.assign([0, "6px", 10, 15, 20, 25, 30, 35], {
        spacing1: 3,
        spacing2: 5,
        spacing3: 7,
        spacing4: 10,
        spacing5: 13,
        spacing6: 15,
        spacing7: 20,
        spacing8: 25,
        spacing9: 30,
        spacing10: 35,
        spacing11: 40,
        spacing12: 45,
        spacing13: 50
      }),
      sizes: { full: "100%", half: "50%" },
      radii: {
        none: 0,
        default: 5,
        large: 7,
        dialog: 10,
        small: 2.5,
        radius1: 5,
        radius2: 10,
        radius3: 15,
        radius4: 20,
        radius5: 25,
        radius6: 30,
        radius7: 35,
        radius8: 40,
        radius9: 45
      },
      iconSizes: { big: 16, medium: 14, small: 12 },
      colors: flattenVariants(config.scope),
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

function flattenVariants(variants: VariantsWithStaticColors) {
  const colors: Partial<Record<ThemeColor, string>> = {};
  for (const variantKey in variants) {
    const variant = variants[variantKey as keyof VariantsWithStaticColors];
    if (!variant) continue;

    for (const colorKey in variant) {
      const suffix =
        variantKey === "primary" || variantKey === "static"
          ? ""
          : `-${variantKey}`;
      colors[`${colorKey}${suffix}` as ThemeColor] =
        variant[colorKey as keyof typeof variant];
    }
  }
  return colors as Record<ThemeColor, string>;
}
