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
import { useColorScheme } from "react-native";
import type * as Contract from "../../../ui/hooks";
import { lastPointer } from "./style/use-styled";

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
