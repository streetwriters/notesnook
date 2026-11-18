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

import { useSyncExternalStore } from "react";
import type * as Contract from "../../../ui/hooks";
import { useThemeContext } from "./theme";

const pointer = { x: 0, y: 0 };
window.addEventListener(
  "pointermove",
  (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  },
  { capture: true, passive: true }
);

export const useMediaQuery: typeof Contract.useMediaQuery = (query) => {
  const list = window.matchMedia(query);
  return useSyncExternalStore(
    (listener) => {
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    () => list.matches
  );
};

export const matchMediaQuery: typeof Contract.matchMediaQuery = (query) =>
  window.matchMedia(query).matches;

let size = { width: window.innerWidth, height: window.innerHeight };

function subscribeSize(listener: () => void) {
  const onResize = () => {
    if (
      size.width === window.innerWidth &&
      size.height === window.innerHeight
    )
      return;
    size = { width: window.innerWidth, height: window.innerHeight };
    listener();
  };
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

export const useWindowSize: typeof Contract.useWindowSize = () =>
  useSyncExternalStore(subscribeSize, () => size);

export const getPointerPosition: typeof Contract.getPointerPosition = () => ({
  x: pointer.x,
  y: pointer.y
});

export const useThemeColor: typeof Contract.useThemeColor = (token) =>
  useThemeContext().colors[token] ?? "transparent";
