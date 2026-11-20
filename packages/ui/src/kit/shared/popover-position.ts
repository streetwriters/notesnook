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

import type { AnchorRect, PopoverPlacement } from "../contracts/overlays";

export type PopoverPosition = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

const GAP = 5;
const SIDE_ROOM = 240;

export function popoverPosition(
  rect: AnchorRect,
  placement: PopoverPlacement,
  window: { width: number; height: number }
): PopoverPosition {
  if (placement === "right-start") {
    const fitsRight = rect.x + rect.width + SIDE_ROOM <= window.width;
    return fitsRight
      ? { top: rect.y, left: rect.x + rect.width + GAP }
      : { top: rect.y, right: window.width - rect.x + GAP };
  }
  const below = placement.startsWith("bottom");
  const start = placement.endsWith("start");
  return {
    top: below ? rect.y + rect.height + GAP : undefined,
    bottom: below ? undefined : window.height - rect.y + GAP,
    left: start ? rect.x : undefined,
    right: start ? undefined : window.width - rect.x - rect.width
  };
}
