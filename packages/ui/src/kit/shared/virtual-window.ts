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

/**
 * Item offsets for a list of variable-height items. `offsets[i]` is the top of
 * item `i` and `offsets[count]` is the total height. Items that have not been
 * measured use `estimated`.
 */
export function computeOffsets(
  count: number,
  estimated: number,
  sizes: ReadonlyMap<number, number>
) {
  const offsets = new Float64Array(count + 1);
  for (let index = 0; index < count; index++)
    offsets[index + 1] = offsets[index] + (sizes.get(index) ?? estimated);
  return offsets;
}

/** The index of the item containing `position` (clamped to the list). */
export function indexAt(offsets: Float64Array, position: number) {
  const count = offsets.length - 1;
  if (count <= 0) return 0;
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (offsets[mid] <= position) low = mid;
    else high = mid - 1;
  }
  return low;
}

/**
 * The inclusive range of items to mount for a viewport, widened by `overscan`
 * pixels on both sides.
 */
export function visibleRange(
  offsets: Float64Array,
  scrollTop: number,
  viewportHeight: number,
  overscan: number
) {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: -1 };
  const start = indexAt(offsets, Math.max(0, scrollTop - overscan));
  const end = indexAt(offsets, scrollTop + viewportHeight + overscan);
  return { start, end: Math.min(count - 1, end) };
}

/** The scroll offset that puts item `index` at `align` in the viewport. */
export function scrollOffsetFor(
  offsets: Float64Array,
  index: number,
  viewportHeight: number,
  align: "start" | "center" | "end"
) {
  const clamped = Math.max(0, Math.min(index, offsets.length - 2));
  const top = offsets[clamped];
  const height = offsets[clamped + 1] - top;
  if (align === "start") return top;
  if (align === "end") return top + height - viewportHeight;
  return top + height / 2 - viewportHeight / 2;
}
