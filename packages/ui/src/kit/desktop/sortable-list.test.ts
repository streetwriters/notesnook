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

import { createElement as h } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { SortableMove } from "../contracts/lists";
import { SortableList } from "./sortable-list";
import { reset } from "./testing/mocks";
import { cleanup, render, settle, textOf } from "./testing/render";

vi.mock("./primitives", async () =>
  (await import("./testing/mocks")).primitives()
);

beforeEach(reset);
afterEach(cleanup);

const tabs = [
  { id: "notes", group: "main" },
  { id: "tags", group: "main" },
  { id: "trash", group: "other" }
];

async function list(onMove: (move: SortableMove) => void) {
  const view = await render(
    h(SortableList as any, {
      "data-test-id": "tabs",
      items: tabs,
      onMove,
      renderItem: (
        item: { id: string },
        state: { isDragging: boolean; isOver: boolean }
      ) =>
        `${item.id}${state.isDragging ? "(dragging)" : ""}${
          state.isOver ? "(over)" : ""
        } `
    })
  );
  const item = (index: number) => view.byTestId("tabs").children[index] as any;
  return { view, item };
}

/** The drag event the native layer raises: a data transfer shared by start and drop. */
function dragging() {
  const data = new Map<string, string>();
  return {
    dataTransfer: {
      setData: (type: string, value: string) => void data.set(type, value),
      getData: (type: string) => data.get(type) ?? ""
    }
  };
}

test("draws every item in order", async () => {
  const { view } = await list(() => {});
  expect(textOf(view.byTestId("tabs"))).toBe("notes tags trash ");
});

test("dropping an item on another reports which moved, where to, and the target's group", async () => {
  const moves: SortableMove[] = [];
  const { item } = await list((move) => moves.push(move));
  const event = dragging();
  await settle(() => item(0).props.onDragStart(event));
  await settle(() => item(2).props.onDragEnter());
  await settle(() => item(2).props.onDrop(event));
  expect(moves).toEqual([
    { activeId: "notes", overId: "trash", index: 2, group: "other" }
  ]);
});

test("shows which item is dragged and which it is over, and clears both after the drop", async () => {
  const { view, item } = await list(() => {});
  const event = dragging();
  await settle(() => item(0).props.onDragStart(event));
  await settle(() => item(1).props.onDragEnter());
  expect(textOf(view.byTestId("tabs"))).toBe(
    "notes(dragging) tags(over) trash "
  );

  await settle(() => item(1).props.onDrop(event));
  expect(textOf(view.byTestId("tabs"))).toBe("notes tags trash ");
});

test("dropping an item on itself, or a drop with no item dragged, reports nothing", async () => {
  const moves: SortableMove[] = [];
  const { item } = await list((move) => moves.push(move));
  const event = dragging();
  await settle(() => item(1).props.onDragStart(event));
  await settle(() => item(1).props.onDrop(event));
  await settle(() => item(0).props.onDrop(dragging()));
  expect(moves).toEqual([]);
});

test("a drag that ends without a drop reports nothing and clears the state", async () => {
  const moves: SortableMove[] = [];
  const { view, item } = await list((move) => moves.push(move));
  const event = dragging();
  await settle(() => item(0).props.onDragStart(event));
  await settle(() => item(2).props.onDragEnter());
  expect(textOf(view.byTestId("tabs"))).toBe(
    "notes(dragging) tags trash(over) "
  );
  await settle(() => item(0).props.onDragEnd(event));
  expect(moves).toEqual([]);
  expect(textOf(view.byTestId("tabs"))).toBe("notes tags trash ");
});
