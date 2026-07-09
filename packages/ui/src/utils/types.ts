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

import { Theme, ThemeColor } from "@notesnook/theme";
import { ThemeUIStyleObject } from "@theme-ui/core";

type ThemeSpace = Theme["space"];

type ValidSpaceValues =
  | Exclude<keyof ThemeSpace, keyof Array<any> | "small">
  | "small"
  | number;

export type RestrictedColorProps = {
  color?: ThemeColor;
  bg?: ThemeColor | (ThemeColor | null)[];
  backgroundColor?: ThemeColor | (ThemeColor | null)[];
};

export type RestrictedSpaceProps = {
  [K in
    | "m"
    | "mt"
    | "mr"
    | "mb"
    | "ml"
    | "mx"
    | "my"
    | "margin"
    | "marginTop"
    | "marginRight"
    | "marginBottom"
    | "marginLeft"
    | "marginX"
    | "marginY"
    | "p"
    | "pt"
    | "pr"
    | "pb"
    | "pl"
    | "px"
    | "py"
    | "padding"
    | "paddingTop"
    | "paddingRight"
    | "paddingBottom"
    | "paddingLeft"
    | "paddingX"
    | "paddingY"]?: ValidSpaceValues | (ValidSpaceValues | null)[];
};

export type RestrictedSxProp = Omit<
  ThemeUIStyleObject,
  keyof RestrictedSpaceProps | keyof RestrictedColorProps
> &
  RestrictedSpaceProps &
  RestrictedColorProps;
