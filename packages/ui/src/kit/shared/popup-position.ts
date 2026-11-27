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

// Where a popup goes for a `PositionOptions`, following `getPosition` in
// packages/ui/src/utils/position.ts (the web's, built on floating-ui): the
// same sides, alignment and offsets, flipped to the other side when it does
// not fit and kept inside the window.

export type PopupRect = { x: number; y: number; width: number; height: number };
export type PopupSize = { width: number; height: number };

export type PopupPlacement = {
  location?: "right" | "left" | "below" | "top";
  align?: "center" | "start" | "end";
  yOffset?: number;
  xOffset?: number;
  gap?: number;
};

export type PopupPosition = {
  top: number;
  left: number;
  /** Set when the popup is taller than the window can show. */
  maxHeight?: number;
};

const PADDING = 10;

type Side = "bottom" | "top" | "right" | "left";

const OPPOSITE: Record<Side, Side> = {
  bottom: "top",
  top: "bottom",
  right: "left",
  left: "right"
};

function place(
  side: Side,
  anchor: PopupRect,
  floating: PopupSize,
  placement: PopupPlacement
) {
  const { align = "start", xOffset = 0, yOffset = 0, gap = 0 } = placement;
  const vertical = side === "bottom" || side === "top";
  // Without a location the popup opens over its target (a menu at the
  // pointer), so the target's height is taken back off.
  const main = vertical
    ? placement.location
      ? yOffset
      : -anchor.height - yOffset
    : gap + (side === "left" ? -xOffset : xOffset);
  const cross = vertical ? xOffset : -yOffset;

  const along = (start: number, size: number, own: number) =>
    align === "center"
      ? start + size / 2 - own / 2
      : align === "end"
      ? start + size - own
      : start;

  if (vertical)
    return {
      top:
        side === "bottom"
          ? anchor.y + anchor.height + main
          : anchor.y - floating.height - main,
      left: along(anchor.x, anchor.width, floating.width) + cross
    };
  return {
    left:
      side === "right"
        ? anchor.x + anchor.width + main
        : anchor.x - floating.width - main,
    top: along(anchor.y, anchor.height, floating.height) + cross
  };
}

function overflow(
  side: Side,
  position: { top: number; left: number },
  floating: PopupSize,
  window: PopupSize
) {
  switch (side) {
    case "bottom":
      return position.top + floating.height - window.height;
    case "top":
      return -position.top;
    case "right":
      return position.left + floating.width - window.width;
    case "left":
      return -position.left;
  }
}

function clamp(value: number, size: number, limit: number) {
  return Math.max(PADDING, Math.min(value, limit - size - PADDING));
}

export function popupPosition(
  anchor: PopupRect,
  floating: PopupSize,
  placement: PopupPlacement,
  window: PopupSize
): PopupPosition {
  const side: Side =
    !placement.location || placement.location === "below"
      ? "bottom"
      : placement.location;

  let position = place(side, anchor, floating, placement);
  const over = overflow(side, position, floating, window);
  if (over > 0) {
    const flipped = place(OPPOSITE[side], anchor, floating, placement);
    if (overflow(OPPOSITE[side], flipped, floating, window) < over)
      position = flipped;
  }

  const available = Math.max(0, window.height - PADDING * 2);
  const height = Math.min(floating.height, available);
  const result: PopupPosition = {
    top: clamp(position.top, height, window.height),
    left: clamp(position.left, floating.width, window.width)
  };
  if (floating.height > available) result.maxHeight = available;
  return result;
}
