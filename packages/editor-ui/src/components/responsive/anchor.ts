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

import type { AnchorRect, PopoverPlacement, UIElement } from "@ui";
import type { AnchorRect as QueryAnchorRect } from "../../queries/queries.js";

export type PopupAnchorRef = { current: UIElement | null };

export type ResolvedAnchor = {
  anchorRef?: PopupAnchorRef;
  anchorRect?: AnchorRect;
  placement: PopoverPlacement;
};

/** The `anchor` query answers in edges; `@ui` popovers take a position and a size. */
export function toPopoverRect(
  measured: QueryAnchorRect | null | undefined
): AnchorRect | undefined {
  if (!measured) return undefined;
  return {
    x: measured.left,
    y: measured.top,
    width: measured.right - measured.left,
    height: measured.bottom - measured.top
  };
}

/**
 * Picks where a popup opens: an explicit rect, else what the editor's
 * `anchor` query measured, else the control it was given, else `fallbackRef`
 * (the toolbar).
 */
export function pickPopupAnchor(inputs: {
  anchorRect?: AnchorRect;
  measured?: AnchorRect;
  anchorRef?: PopupAnchorRef;
  fallbackRef: PopupAnchorRef;
  placement?: PopoverPlacement;
}): ResolvedAnchor {
  const placement = inputs.placement ?? "bottom-start";
  if (inputs.anchorRect) return { anchorRect: inputs.anchorRect, placement };
  if (inputs.measured) return { anchorRect: inputs.measured, placement };
  return { anchorRef: inputs.anchorRef ?? inputs.fallbackRef, placement };
}
