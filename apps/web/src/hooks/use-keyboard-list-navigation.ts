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

import { useCallback, useRef } from "react";
import { keydownHandler } from "../common/key-handler";

enum DIRECTION {
  UP = -1,
  SAME = 0,
  DOWN = 1
}

type UseKeyboardListNavigationOptions = {
  length: number;
  reset: () => void;
  select: (index: number, toggleable?: boolean) => void;
  deselect: (index: number) => void;
  bulkSelect: (indices: number[]) => void;
  focusItemAt: (index: number) => void;
  open?: (index: number) => void;
  skip?: (index: number) => boolean;
  /**
   * Open the item the arrow keys land on, instead of only moving focus to it.
   * Lists that treat the focused item as the selected one (the notes list)
   * enable this; lists that are a tree of containers leave it off, because
   * moving focus there must not open anything.
   */
  openOnMove?: boolean;
};

export function useKeyboardListNavigation(
  options: UseKeyboardListNavigationOptions
) {
  const {
    length,
    skip,
    open,
    deselect,
    reset,
    select,
    bulkSelect,
    focusItemAt,
    openOnMove
  } = options;
  const cursor = useRef(-1);
  const anchor = useRef(-1);
  // const { reset, select, deselect } = useSelection();

  const direction = useCallback(() => {
    return cursor.current === anchor.current
      ? DIRECTION.SAME
      : cursor.current > anchor.current
      ? DIRECTION.DOWN
      : DIRECTION.UP;
  }, []);

  const resetSelection = useCallback(() => {
    reset();
    anchor.current = -1;
  }, [reset]);

  const openActiveItem = useCallback(() => {
    if (!open || cursor.current < 0 || cursor.current >= length) return false;
    resetSelection();
    open(cursor.current);
    select(cursor.current);
    return true;
  }, [open, resetSelection, select, length]);

  /**
   * Moves the cursor to `nextIndex`, focuses that row, and — on lists that opt
   * in — opens it. Returns false only when the index is outside the list, so a
   * key that cannot move anything keeps its default behaviour.
   */
  const moveTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= length) return false;
      const moved = nextIndex !== cursor.current;
      resetSelection();
      focusItemAt(nextIndex);
      cursor.current = nextIndex;
      if (moved && openOnMove && open) open(nextIndex);
      return true;
    },
    [length, resetSelection, focusItemAt, openOnMove, open]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent, itemIndex: number) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey) {
        select(itemIndex, true);
      } else if (e.shiftKey) {
        const startIndex =
          itemIndex > cursor.current ? cursor.current : itemIndex;
        const endIndex =
          itemIndex > cursor.current ? itemIndex : cursor.current;
        const indices = [];
        for (let i = startIndex; i <= endIndex; ++i) {
          if (skip && skip(i)) continue;
          indices.push(i);
        }
        bulkSelect(indices);
        focusItemAt(itemIndex);
      } else {
        resetSelection();
        select(itemIndex);
      }
      cursor.current = itemIndex;
    },
    [select, resetSelection, bulkSelect, skip, focusItemAt]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      keydownHandler({
        Space: openActiveItem,
        Enter: openActiveItem,
        ArrowUp: () => moveTo(nextIndexFrom(cursor.current, -1, length, skip)),
        ArrowDown: () => moveTo(nextIndexFrom(cursor.current, 1, length, skip)),
        ...(openOnMove
          ? {
              k: () => moveTo(nextIndexFrom(cursor.current, -1, length, skip)),
              j: () => moveTo(nextIndexFrom(cursor.current, 1, length, skip))
            }
          : {}),
        "Mod-a": () => {
          resetSelection();
          bulkSelect(new Array(length).fill(0).map((_, i) => i));
          return true;
        },
        "Shift-ArrowUp": () => {
          if (anchor.current === -1) {
            anchor.current = cursor.current;
            if (anchor.current >= 0 && anchor.current < length) {
              select(anchor.current);
            }
          }

          if (
            direction() === DIRECTION.DOWN &&
            cursor.current >= 0 &&
            cursor.current < length
          ) {
            deselect(cursor.current);
          }

          let nextIndex = moveUp(cursor.current);
          if (skip && skip(nextIndex)) nextIndex = moveUp(nextIndex);
          if (nextIndex === cursor.current) return false;

          focusItemAt(nextIndex);
          cursor.current = nextIndex;
          if (direction() === DIRECTION.UP) {
            select(nextIndex);
          }
          e.preventDefault();
          return false;
        },
        "Shift-ArrowDown": () => {
          if (anchor.current === -1) {
            anchor.current = cursor.current;
            if (anchor.current >= 0 && anchor.current < length) {
              select(anchor.current);
            }
          }

          if (
            direction() === DIRECTION.UP &&
            cursor.current >= 0 &&
            cursor.current < length
          ) {
            deselect(cursor.current);
          }

          let nextIndex = moveDown(cursor.current, length - 1);
          if (skip && skip(nextIndex))
            nextIndex = moveDown(nextIndex, length - 1);
          if (nextIndex === cursor.current) return false;

          focusItemAt(nextIndex);
          cursor.current = nextIndex;
          if (direction() === DIRECTION.DOWN) {
            select(nextIndex);
          }
          e.preventDefault();
          return false;
        },
        Escape: () => {
          resetSelection();
          return true;
        }
      })(e);
    },
    [
      length,
      openActiveItem,
      moveTo,
      openOnMove,
      resetSelection,
      skip,
      focusItemAt,
      bulkSelect,
      direction,
      select,
      deselect
    ]
  );

  return { onMouseUp, onKeyDown };
}

/**
 * The next index one step up or down `length` rows, wrapping at both ends, and
 * stepping over the rows `skip` rejects. Exported so the movement rules can be
 * tested without mounting the hook.
 */
export function nextIndexFrom(
  current: number,
  delta: 1 | -1,
  length: number,
  skip?: (index: number) => boolean
): number {
  const max = length - 1;
  const step = delta === 1 ? moveDownCyclic : moveUpCyclic;
  let next = step(current, max);
  // A list where every row is skipped has no reachable index; stop instead of
  // looping forever.
  for (let attempts = 0; attempts < length; attempts++) {
    if (!skip || !skip(next)) return next;
    next = step(next, max);
  }
  return current;
}

const moveDownCyclic = (i: number, max: number) => (i < max ? ++i : 0);
const moveUpCyclic = (i: number, max: number) => (i > 0 ? --i : max);
const moveDown = (i: number, max: number) => (i < max ? ++i : max);
const moveUp = (i: number) => (i > 0 ? --i : 0);
