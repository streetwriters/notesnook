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

import type {
  CalculateViewLocationParams,
  IndexLocationWithAlign,
  ScrollIntoViewLocation
} from "../contracts/lists";

// react-virtuoso's scroll locations, translated to rows of the native list.
// A "row" is what the native list holds; in a grouped list the group headers
// are rows too, so an item's row is not its index.

export type Align = "start" | "center" | "end";

/** What the native list's `scrollToIndex` takes. */
export type RowTarget = {
  index: number;
  animated: boolean;
  viewPosition: number;
  viewOffset?: number;
};

export type GroupRow =
  | { type: "group"; groupIndex: number }
  | { type: "item"; groupIndex: number; index: number };

/** The rows of a grouped list: each group's header, then its items. */
export function groupRows(groupCounts: readonly number[]): GroupRow[] {
  const rows: GroupRow[] = [];
  let index = 0;
  groupCounts.forEach((count, groupIndex) => {
    rows.push({ type: "group", groupIndex });
    for (let i = 0; i < count; i++)
      rows.push({ type: "item", groupIndex, index: index++ });
  });
  return rows;
}

/** The row of the item at `index`, counted across groups without headers. */
export function rowOfItem(
  groupCounts: readonly number[],
  index: number
): number | undefined {
  if (!Number.isInteger(index) || index < 0) return undefined;
  let before = 0;
  for (let group = 0; group < groupCounts.length; group++) {
    if (index < before + groupCounts[group]) return index + group + 1;
    before += groupCounts[group];
  }
  return undefined;
}

/** The row of a group's header. */
export function rowOfGroup(
  groupCounts: readonly number[],
  groupIndex: number
): number | undefined {
  if (
    !Number.isInteger(groupIndex) ||
    groupIndex < 0 ||
    groupIndex >= groupCounts.length
  )
    return undefined;
  let row = 0;
  for (let group = 0; group < groupIndex; group++)
    row += groupCounts[group] + 1;
  return row;
}

/** The row of an index in a flat list; `"LAST"` is the last one. */
export function rowOfIndex(
  count: number,
  index: number | "LAST"
): number | undefined {
  if (count <= 0) return undefined;
  if (index === "LAST") return count - 1;
  if (!Number.isFinite(index)) return undefined;
  return Math.max(0, Math.min(count - 1, Math.trunc(index)));
}

export type RowResolver = (
  location: { index: number | "LAST" } | { groupIndex: number }
) => number | undefined;

function viewPosition(align: Align | undefined) {
  return align === "center" ? 0.5 : align === "end" ? 1 : 0;
}

/**
 * A `scrollToIndex` location as the native list's target, or undefined when it
 * names no row (an empty list, an index out of a grouped list's range).
 */
export function toRowTarget(
  location: number | IndexLocationWithAlign,
  rowOf: RowResolver
): RowTarget | undefined {
  const options = typeof location === "number" ? { index: location } : location;
  const index = rowOf(options);
  if (index === undefined) return undefined;
  const target: RowTarget = {
    index,
    animated: options.behavior === "smooth",
    viewPosition: viewPosition(options.align)
  };
  // react-virtuoso's offset moves the scroll position down; the native list's
  // moves the item down. They are opposite.
  if (options.offset) target.viewOffset = -options.offset;
  return target;
}

/** react-virtuoso's default: scroll only when the item is out of view. */
export function defaultCalculateViewLocation(
  params: CalculateViewLocationParams
): IndexLocationWithAlign | number | null {
  const { itemTop, itemBottom, viewportTop, viewportBottom, locationParams } =
    params;
  const { behavior, align, ...rest } = locationParams;
  if (itemTop < viewportTop)
    return { ...rest, behavior, align: align ?? "start" };
  if (itemBottom > viewportBottom)
    return { ...rest, behavior, align: align ?? "end" };
  return null;
}

/**
 * Where `scrollIntoView` must scroll to, or null when the item is already in
 * view. `view` is the item's and the viewport's top and bottom, in the list's
 * scroll coordinates.
 */
export function resolveScrollIntoView(
  location: ScrollIntoViewLocation,
  view: Omit<CalculateViewLocationParams, "locationParams">
): IndexLocationWithAlign | number | null {
  const {
    calculateViewLocation = defaultCalculateViewLocation,
    done: _done,
    ...locationParams
  } = location;
  return calculateViewLocation({ ...view, locationParams });
}
