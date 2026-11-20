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
  computePosition,
  flip,
  offset,
  shift,
  type Platform
} from "@floating-ui/core";
import type { AnchorRect, PopoverPlacement } from "../contracts/overlays";

type Size = { width: number; height: number };
type Box = { anchor: AnchorRect; floating: Size; window: Size };

const PADDING = 10;

const platform: Platform = {
  getElementRects: ({ reference }) => {
    const box = reference as Box;
    return {
      reference: { ...box.anchor },
      floating: { x: 0, y: 0, ...box.floating }
    };
  },
  getDimensions: (element) => (element as Box).floating,
  getClippingRect: ({ element }) => ({
    x: 0,
    y: 0,
    ...(element as Box).window
  })
};

export async function popoverPosition(
  anchor: AnchorRect,
  floating: Size,
  placement: PopoverPlacement,
  window: Size
): Promise<{ top: number; left: number }> {
  const box: Box = { anchor, floating, window };
  const beside = placement.startsWith("right");
  const px = Math.max(0, Math.min(PADDING, (window.width - floating.width) / 2));
  const py = Math.max(
    0,
    Math.min(PADDING, (window.height - floating.height) / 2)
  );
  const padding = { left: px, right: px, top: py, bottom: py };
  const { x, y } = await computePosition(box, box, {
    placement,
    strategy: "fixed",
    platform,
    middleware: [
      offset(beside ? 0 : 5),
      flip({ padding }),
      shift({ padding })
    ]
  });
  return { top: y, left: x };
}
