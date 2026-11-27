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

// @vitest-environment jsdom

import { act, createElement, Fragment, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SortableItem } from "../contracts/lists";
import { SortableList } from "./sortable-list";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(element: ReactElement) {
  act(() => {
    root.render(element);
  });
}

function renderItem(item: SortableItem) {
  return createElement("span", null, item.id);
}

/** The wrapper SortableList puts around each item: the drag source and drop target. */
function row(id: string): HTMLElement {
  const label = [...document.querySelectorAll("span")].find(
    (span) => span.textContent === id
  );
  if (!label?.parentElement) throw new Error(`no row ${id}`);
  return label.parentElement;
}

function fire(target: Element, type: string, transfer?: object): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  if (transfer)
    Object.defineProperty(event, "dataTransfer", { value: transfer });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function transfer() {
  return { setData: vi.fn(), effectAllowed: "none", dropEffect: "none" };
}

describe("web SortableList", () => {
  it("moves a dragged item onto a row of its own group", () => {
    const onMove = vi.fn();
    render(
      createElement(SortableList<SortableItem>, {
        items: [
          { id: "a1", group: "a" },
          { id: "a2", group: "a" },
          { id: "a3", group: "a" }
        ],
        renderItem,
        onMove
      })
    );

    fire(row("a1"), "dragstart", transfer());
    const over = fire(row("a3"), "dragover", transfer());
    expect(over.defaultPrevented).toBe(true);
    fire(row("a3"), "drop", transfer());
    fire(row("a1"), "dragend", transfer());

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({
      activeId: "a1",
      overId: "a3",
      index: 2,
      group: "a"
    });
  });

  it("refuses a row of another group: no move and no drop target", () => {
    const onMove = vi.fn();
    render(
      createElement(SortableList<SortableItem>, {
        items: [
          { id: "a1", group: "a" },
          { id: "b1", group: "b" }
        ],
        renderItem,
        onMove
      })
    );

    fire(row("a1"), "dragstart", transfer());
    const over = fire(row("b1"), "dragover", transfer());
    expect(over.defaultPrevented).toBe(false);
    fire(row("b1"), "drop", transfer());
    fire(row("a1"), "dragend", transfer());

    expect(onMove).not.toHaveBeenCalled();
  });

  it("does nothing when an item is dropped on itself", () => {
    const onMove = vi.fn();
    render(
      createElement(SortableList<SortableItem>, {
        items: [{ id: "a1", group: "a" }],
        renderItem,
        onMove
      })
    );

    fire(row("a1"), "dragstart", transfer());
    fire(row("a1"), "drop", transfer());
    fire(row("a1"), "dragend", transfer());

    expect(onMove).not.toHaveBeenCalled();
  });

  it("refuses an item dragged from another list, even of the same group", () => {
    const onMoveX = vi.fn();
    const onMoveY = vi.fn();
    render(
      createElement(
        Fragment,
        null,
        createElement(SortableList<SortableItem>, {
          items: [{ id: "x1", group: "a" }],
          renderItem,
          onMove: onMoveX
        }),
        createElement(SortableList<SortableItem>, {
          items: [{ id: "y1", group: "a" }],
          renderItem,
          onMove: onMoveY
        })
      )
    );

    fire(row("x1"), "dragstart", transfer());
    fire(row("y1"), "drop", transfer());
    fire(row("x1"), "dragend", transfer());

    expect(onMoveY).not.toHaveBeenCalled();
    expect(onMoveX).not.toHaveBeenCalled();
  });
});
