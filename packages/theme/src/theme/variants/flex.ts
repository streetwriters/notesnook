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

import { ThemeUIStyleObject } from "@theme-ui/core";

type FlexDirection = "row" | "column";
export type FlexVariants<T extends FlexDirection> = T extends "row"
  ? {
      rowCenter: ThemeUIStyleObject;
      rowFill: ThemeUIStyleObject;
      rowCenterFill: ThemeUIStyleObject;
    }
  : {
      columnCenter: ThemeUIStyleObject;
      columnFill: ThemeUIStyleObject;
      columnCenterFill: ThemeUIStyleObject;
    };

export function createFlexVariants<T extends FlexDirection>(
  direction: T
): FlexVariants<T> {
  const variants = {
    Center: createCenterVariant(direction),
    Fill: createFillVariant(direction),
    CenterFill: createCenterFillVariant(direction)
  };
  return Object.fromEntries(
    Object.entries(variants).map(([key, value]) => {
      return [`${direction}${key}`, value];
    })
  ) as FlexVariants<T>;
}

function createCenterVariant(direction: FlexDirection): ThemeUIStyleObject {
  return {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: direction
  };
}

function createFillVariant(direction: FlexDirection): ThemeUIStyleObject {
  return {
    flex: "1 1 auto",
    flexDirection: direction
  };
}

function createCenterFillVariant(direction: FlexDirection): ThemeUIStyleObject {
  return {
    variant: `variants.${direction}Center`,
    flex: "1 1 auto",
    flexDirection: direction
  };
}
