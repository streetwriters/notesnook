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

import type { BaseProps, SxProp } from "../../ui";

export const SHORTHAND_KEYS = [
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginX",
  "marginY",
  "p",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingX",
  "paddingY",
  "gap",
  "rowGap",
  "columnGap",
  "color",
  "bg",
  "backgroundColor"
] as const;

export function mergeShorthands(
  props: BaseProps,
  defaults?: SxProp
): SxProp | undefined {
  let merged: Record<string, unknown> | undefined;
  for (const key of SHORTHAND_KEYS) {
    const value = (props as Record<string, unknown>)[key];
    if (value === undefined) continue;
    (merged ??= {})[key] = value;
  }
  if (!merged && !defaults) return props.sx;
  return { ...defaults, ...merged, ...props.sx } as SxProp;
}
