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

import { Appearance, Dimensions, useWindowDimensions } from "react-native";
import { Platform, useColorScheme } from "react-native";
import type * as Contract from "../contracts/hooks";
import type { SxProp } from "../contracts/style";
import { formatShortcutFor, type ShortcutPlatform } from "../shared/shortcut";
import { lastPointer } from "./style/events";
import { alphaToken, withAlpha } from "./style/resolve";
import { useThemeContext } from "./theme";

function evaluate(
  query: string,
  width: number,
  scheme: string | null | undefined
) {
  return query
    .split(/\band\b/)
    .map((part) => part.trim().replace(/^\(|\)$/g, ""))
    .every((condition) => {
      const [name, value] = condition.split(":").map((v) => v.trim());
      switch (name) {
        case "min-width":
          return width >= parseFloat(value);
        case "max-width":
          return width <= parseFloat(value);
        case "prefers-color-scheme":
          return (scheme ?? "light") === value;
        default:
          return false;
      }
    });
}

export const useMediaQuery: typeof Contract.useMediaQuery = (query) => {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  return evaluate(query, width, scheme);
};

export const matchMediaQuery: typeof Contract.matchMediaQuery = (query) =>
  evaluate(query, Dimensions.get("window").width, Appearance.getColorScheme());

export const useWindowSize: typeof Contract.useWindowSize = () => {
  const { width, height } = useWindowDimensions();
  return { width, height };
};

export const getPointerPosition: typeof Contract.getPointerPosition = () => ({
  x: lastPointer.x,
  y: lastPointer.y
});

export const useThemeUI: typeof Contract.useThemeUI = () => ({
  theme: useThemeContext().theme
});

/**
 * `color` at `amount` opacity. A colour literal is computed here; a theme
 * token is resolved against the theme when the `sx` it is used in is drawn.
 */
export const alpha: typeof Contract.alpha = (color, amount) =>
  (color.startsWith("#")
    ? withAlpha(color, amount)
    : alphaToken(color, amount)) as ReturnType<typeof Contract.alpha>;

/**
 * `@notesnook/theme`'s `createButtonVariant` with the selectors desktop draws:
 * its `:hover:not(:disabled):not(:active)` is `:hover` and its
 * `:active:not(:disabled)` is `:active`. The CSS-only parts (`transition`,
 * `height: min-content`, `outline`, `:disabled`) are left out.
 */
export const createButtonVariant: typeof Contract.createButtonVariant = (
  background = "transparent",
  color = "paragraph",
  states
) => {
  const hover = states?.hover;
  const active = states?.active;
  return {
    bg: background,
    color,
    fontFamily: "body",
    fontWeight: "body",
    fontSize: "body",
    borderRadius: "default",
    cursor: "pointer",
    px: 2,
    py: 1,
    overflow: "hidden",
    ":hover": { bg: background, ...hover },
    ":active": { bg: background, ...hover, ...active }
  };
};

export const useThemeColor: typeof Contract.useThemeColor = (token) =>
  useThemeContext().colors[token] ?? "transparent";

const os: string = Platform.OS;
const shortcutPlatform: ShortcutPlatform =
  os === "macos" ? "mac" : os === "ios" || os === "android" ? "touch" : "pc";

export const formatShortcut: typeof Contract.formatShortcut = (keys) =>
  formatShortcutFor(keys, shortcutPlatform);
