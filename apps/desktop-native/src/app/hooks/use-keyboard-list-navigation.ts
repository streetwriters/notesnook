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
import type { KeyEvent, PressEvent } from "@ui";

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
    focusItemAt
  } = options;
  const cursor = useRef(-1);
  const anchor = useRef(-1);

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

  const onMouseUp = useCallback(
    (
      e: Pick<PressEvent, "button" | "ctrlKey" | "metaKey" | "shiftKey">,
      itemIndex: number
    ) => {
      if (e.button !== "primary") return;
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
    (e: KeyEvent) => {
      const max = length - 1;
      const handled = (fn: () => boolean) => {
        if (fn()) e.preventDefault();
      };

      const shiftArrow = (dir: DIRECTION.UP | DIRECTION.DOWN) => {
        if (anchor.current === -1) {
          anchor.current = cursor.current;
          if (anchor.current >= 0 && anchor.current < length) {
            select(anchor.current);
          }
        }

        if (
          direction() === -dir &&
          cursor.current >= 0 &&
          cursor.current < length
        ) {
          deselect(cursor.current);
        }

        const step =
          dir === DIRECTION.UP ? moveUp : (i: number) => moveDown(i, max);
        let nextIndex = step(cursor.current);
        if (skip && skip(nextIndex)) nextIndex = step(nextIndex);
        if (nextIndex === cursor.current) return;

        focusItemAt(nextIndex);
        cursor.current = nextIndex;
        if (direction() === dir) {
          select(nextIndex);
        }
        e.preventDefault();
      };

      const mod = e.metaKey || e.ctrlKey;
      switch (e.key) {
        case " ":
        case "Enter":
          if (!mod && !e.shiftKey) handled(openActiveItem);
          return;
        case "ArrowUp":
          if (e.shiftKey) return shiftArrow(DIRECTION.UP);
          handled(() => {
            resetSelection();
            let nextIndex = moveUpCyclic(cursor.current, max);
            while (skip && skip(nextIndex))
              nextIndex = moveUpCyclic(nextIndex, max);
            focusItemAt(nextIndex);
            cursor.current = nextIndex;
            return true;
          });
          return;
        case "ArrowDown":
          if (e.shiftKey) return shiftArrow(DIRECTION.DOWN);
          handled(() => {
            resetSelection();
            let nextIndex = moveDownCyclic(cursor.current, max);
            while (skip && skip(nextIndex))
              nextIndex = moveDownCyclic(nextIndex, max);
            focusItemAt(nextIndex);
            cursor.current = nextIndex;
            return true;
          });
          return;
        case "a":
          if (!mod) return;
          handled(() => {
            resetSelection();
            bulkSelect(new Array(length).fill(0).map((_, i) => i));
            return true;
          });
          return;
        case "Escape":
          handled(() => {
            resetSelection();
            return true;
          });
          return;
      }
    },
    [
      length,
      openActiveItem,
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

const moveDownCyclic = (i: number, max: number) => (i < max ? ++i : 0);
const moveUpCyclic = (i: number, max: number) => (i > 0 ? --i : max);
const moveDown = (i: number, max: number) => (i < max ? ++i : max);
const moveUp = (i: number) => (i > 0 ? --i : 0);
