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

import { createElement } from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import type { UIMouseEvent } from "../contracts/events";
import type { ListCursor } from "../contracts/lists";
import { useListCursor } from "./list-selection";

// This environment has no DOM for React to detect that act() is in use.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

// Mounts the hook in a throwaway component and returns a ref to its latest value.
function mountCursor(): { current: ListCursor } {
  const ref: { current?: ListCursor } = {};
  function Probe() {
    ref.current = useListCursor();
    return null;
  }
  act(() => {
    create(createElement(Probe));
  });
  return ref as { current: ListCursor };
}

function press(
  modifiers: Partial<Record<"metaKey" | "shiftKey" | "ctrlKey", boolean>> = {}
) {
  return {
    metaKey: false,
    shiftKey: false,
    ctrlKey: false,
    ...modifiers
  } as unknown as UIMouseEvent;
}

describe("useListCursor", () => {
  it("moves the cursor to a pressed item, binds the press and opens it", () => {
    const cursor = mountCursor();
    const bound = vi.fn();
    const open = vi.fn();
    act(() => {
      cursor.current.bindPress(bound);
    });
    act(() => {
      cursor.current.selection.onItemPress(3, "a", press(), open);
    });
    expect(cursor.current.selection.focusedIndex).toBe(3);
    expect(bound).toHaveBeenCalledWith(press(), 3);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("moves the cursor without opening when a modifier key is held", () => {
    const cursor = mountCursor();
    const open = vi.fn();
    act(() => {
      cursor.current.selection.onItemPress(
        1,
        "a",
        press({ shiftKey: true }),
        open
      );
    });
    expect(cursor.current.selection.focusedIndex).toBe(1);
    expect(open).not.toHaveBeenCalled();
  });

  it("opens the item registered at an index until it unregisters", () => {
    const cursor = mountCursor();
    const open = vi.fn();
    let unregister: () => void = () => undefined;
    act(() => {
      unregister = cursor.current.selection.register(2, open);
    });
    cursor.current.openAt(2);
    expect(open).toHaveBeenCalledTimes(1);

    act(() => {
      unregister();
    });
    cursor.current.openAt(2);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("clears the cursor when set to -1", () => {
    const cursor = mountCursor();
    act(() => {
      cursor.current.setFocusedIndex(4);
    });
    expect(cursor.current.selection.focusedIndex).toBe(4);
    act(() => {
      cursor.current.setFocusedIndex(-1);
    });
    expect(cursor.current.selection.focusedIndex).toBe(-1);
  });

  it("passes presses to the most recently bound handler", () => {
    const cursor = mountCursor();
    const first = vi.fn();
    const second = vi.fn();
    act(() => {
      cursor.current.bindPress(first);
    });
    act(() => {
      cursor.current.bindPress(second);
    });
    act(() => {
      cursor.current.selection.onItemPress(0, "a", press(), () => undefined);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
