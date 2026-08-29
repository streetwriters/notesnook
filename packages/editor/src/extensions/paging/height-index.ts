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
 * Where each child of a container sits, as a running total of the heights
 * before it.
 *
 * The children that are off screen are hidden rather than laid out, so the
 * browser cannot be asked where they are. Adding their heights up answers the
 * same question without touching the DOM, and answers it for every child
 * rather than only the ones on screen.
 */
export type HeightIndex = {
  /** `before[i]` is the height of children 0..i-1; the last entry is the total. */
  before: Float64Array;
  total: number;
};

/** The first child reaching down to `offset` pixels into the container. */
export function childAt(index: HeightIndex, offset: number): number {
  const { before } = index;
  let low = 0;
  let high = before.length - 2;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (before[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}
