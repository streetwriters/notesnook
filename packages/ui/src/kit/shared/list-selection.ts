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

import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { UIMouseEvent } from "../contracts/events";
import type { ListCursor, ListSelection } from "../contracts/lists";

export const ListSelectionContext = createContext<ListSelection | undefined>(
  undefined
);

export function useListSelection() {
  return useContext(ListSelectionContext);
}

/**
 * The keyboard cursor and open registry of a native list. Each item registers
 * its open action by index; a press moves the cursor to that item and, unless
 * a modifier key is held, opens it. The list binds its own press handler with
 * `bindPress`, so a press also selects the item the way a key press does.
 */
export function useListCursor(): ListCursor {
  const openers = useRef(new Map<number, () => void>());
  const pressHandler = useRef<(event: UIMouseEvent, index: number) => void>(
    () => undefined
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selection = useMemo<ListSelection>(
    () => ({
      focusedIndex,
      register: (index, open) => {
        openers.current.set(index, open);
        return () => {
          if (openers.current.get(index) === open)
            openers.current.delete(index);
        };
      },
      onItemPress: (index, _id, event, open) => {
        pressHandler.current(event, index);
        setFocusedIndex(index);
        if (!event.metaKey && !event.shiftKey && !event.ctrlKey) open();
      }
    }),
    [focusedIndex]
  );

  return useMemo<ListCursor>(
    () => ({
      selection,
      setFocusedIndex,
      openAt: (index) => openers.current.get(index)?.(),
      bindPress: (handler) => {
        pressHandler.current = handler;
      }
    }),
    [selection]
  );
}
