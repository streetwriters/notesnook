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

import { createElement as h, createRef, forwardRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { GroupedVirtuosoHandle, VirtuosoHandle } from "../contracts/lists";
import { ScrollContainer } from "./layout";
import { GroupedVirtuoso, TableVirtuoso, Virtuoso } from "./lists";
import { reset, state } from "./testing/mocks";
import { cleanup, render, settle, textOf } from "./testing/render";

vi.mock("react-native", async () =>
  (await import("./testing/mocks")).reactNative()
);
vi.mock("@platform", async () => (await import("./testing/mocks")).platform());
vi.mock("./style/use-styled", async () =>
  (await import("./testing/mocks")).useStyledModule()
);
vi.mock("./primitives", async () =>
  (await import("./testing/mocks")).primitives()
);
vi.mock("@legendapp/list/react-native", async () =>
  (await import("./testing/mocks")).legendList()
);

beforeEach(reset);
afterEach(cleanup);

const List = Virtuoso as any;
const Grouped = GroupedVirtuoso as any;
const Table = TableVirtuoso as any;
const Scroll = ScrollContainer as any;

const notes = ["Groceries", "Ideas", "Journal"];

function rows(view: Awaited<ReturnType<typeof render>>) {
  return view.all((node) => node.type === "Row").map(textOf);
}

function rowKeys(view: Awaited<ReturnType<typeof render>>) {
  return view.all((node) => node.type === "Row").map((n) => n.props.rowKey);
}

test("renders a row per item of data, through itemContent with the context", async () => {
  const view = await render(
    h(List, {
      data: notes,
      context: { prefix: "#" },
      itemContent: (index: number, note: string, context: { prefix: string }) =>
        `${context.prefix}${index} ${note}`
    })
  );
  expect(rows(view)).toEqual(["#0 Groceries", "#1 Ideas", "#2 Journal"]);
});

test("renders totalCount rows when there is no data, as apps/web's lists do", async () => {
  const view = await render(
    h(List, {
      totalCount: 4,
      computeItemKey: (index: number) => `note-${index}`,
      itemContent: (index: number) => `row ${index}`
    })
  );
  expect(rows(view)).toEqual(["row 0", "row 1", "row 2", "row 3"]);
  expect(rowKeys(view)).toEqual(["note-0", "note-1", "note-2", "note-3"]);
});

test("draws Header, Footer and each row's Item, and EmptyPlaceholder only when empty", async () => {
  const components = {
    Header: (props: any) => h("Header", null, `header ${props.context.name}`),
    Footer: () => h("Footer", null, "footer"),
    EmptyPlaceholder: () => h("Empty", null, "nothing here"),
    Item: (props: any) =>
      h(
        "Item",
        { index: props["data-item-index"], item: props.item },
        props.children
      )
  };
  const itemContent = (_index: number, note: string) => note;
  const view = await render(
    h(List, {
      data: notes,
      context: { name: "notes" },
      components,
      itemContent
    })
  );
  expect(view.text()).toBe("header notesGroceriesIdeasJournalfooter");
  const items = view.all((node) => node.type === "Item");
  expect(items.map((node) => node.props.index)).toEqual([0, 1, 2]);
  expect(items[1].props.item).toBe("Ideas");

  await view.update(
    h(List, { data: [], context: { name: "notes" }, components, itemContent })
  );
  expect(view.text()).toBe("header notesnothing herefooter");
});

test("a new itemContent redraws the rows", async () => {
  const view = await render(
    h(List, { data: notes, itemContent: (_i: number, note: string) => note })
  );
  await view.update(
    h(List, {
      data: notes,
      itemContent: (_i: number, note: string) => note.toUpperCase()
    })
  );
  expect(rows(view)).toEqual(["GROCERIES", "IDEAS", "JOURNAL"]);
});

test("passes the item height, overscan and first item on to the native list", async () => {
  await render(
    h(List, {
      totalCount: 100,
      defaultItemHeight: 72,
      increaseViewportBy: { top: 200, bottom: 300 },
      initialTopMostItemIndex: 40,
      itemContent: () => null
    })
  );
  expect(state.list.props.estimatedItemSize).toBe(72);
  expect(state.list.props.drawDistance).toBe(300);
  expect(state.list.props.initialScrollIndex).toBe(40);
});

test("scrollToIndex takes react-virtuoso's locations", async () => {
  const ref = createRef<VirtuosoHandle>();
  await render(h(List, { ref, totalCount: 100, itemContent: () => null }));

  ref.current!.scrollToIndex(12);
  ref.current!.scrollToIndex({ index: 30, align: "center", behavior: "auto" });
  ref.current!.scrollToIndex({
    index: "LAST",
    align: "end",
    behavior: "smooth"
  });
  ref.current!.scrollToIndex({ index: 5, offset: 20 });
  ref.current!.scrollToIndex(5000);
  expect(state.list.scrollToIndex).toEqual([
    { index: 12, animated: false, viewPosition: 0 },
    { index: 30, animated: false, viewPosition: 0.5 },
    { index: 99, animated: true, viewPosition: 1 },
    { index: 5, animated: false, viewPosition: 0, viewOffset: -20 },
    { index: 99, animated: false, viewPosition: 0 }
  ]);
});

test("scrollToIndex on an empty list does nothing", async () => {
  const ref = createRef<VirtuosoHandle>();
  await render(h(List, { ref, totalCount: 0, itemContent: () => null }));
  ref.current!.scrollToIndex(3);
  ref.current!.scrollToIndex({ index: "LAST" });
  expect(state.list.scrollToIndex).toEqual([]);
});

test("scrollIntoView scrolls only when the item is out of view, and calls done either way", async () => {
  const ref = createRef<VirtuosoHandle>();
  await render(h(List, { ref, totalCount: 100, itemContent: () => null }));
  // Rows are 50 high and the viewport shows 100..500.
  state.list.scroll = 100;
  let done = 0;

  await settle(() =>
    ref.current!.scrollIntoView({ index: 4, done: () => void done++ })
  );
  expect(state.list.scrollToIndex).toEqual([]);
  expect(done).toBe(1);

  await settle(() =>
    ref.current!.scrollIntoView({ index: 0, done: () => void done++ })
  );
  await settle(() =>
    ref.current!.scrollIntoView({ index: 50, done: () => void done++ })
  );
  expect(state.list.scrollToIndex).toEqual([
    { index: 0, animated: false, viewPosition: 0 },
    { index: 50, animated: false, viewPosition: 1 }
  ]);
  expect(done).toBe(3);
});

test("scrollTo and scrollBy move the list by offset", async () => {
  const ref = createRef<VirtuosoHandle>();
  await render(h(List, { ref, totalCount: 100, itemContent: () => null }));
  state.list.scroll = 300;

  ref.current!.scrollTo({ top: 120 });
  ref.current!.scrollBy({ top: 50, behavior: "smooth" });
  ref.current!.scrollBy({ top: -1000 });
  expect(state.list.scrollToOffset).toEqual([
    { offset: 120, animated: false },
    { offset: 350, animated: true },
    { offset: 0, animated: false }
  ]);
});

test("onKeyDown gets a DOM-shaped event with nativeEvent, as apps/web's lists read it", async () => {
  const keys: string[] = [];
  const view = await render(
    h(List, {
      "data-test-id": "notes-list",
      totalCount: 1,
      itemContent: () => null,
      onKeyDown: (event: any) => {
        keys.push(`${event.nativeEvent.key}/${event.code}`);
        expect(event.currentTarget).toBe(event.target);
      }
    })
  );
  view.byTestId("notes-list").props.onKeyDown({ key: "ArrowDown" });
  expect(keys).toEqual(["ArrowDown/ArrowDown"]);
});

test("a Scroller written for the web becomes the list's scroll view", async () => {
  // What apps/web's CustomScrollbarsVirtualList does: a ScrollContainer
  // that is given the list's props and children.
  const Scroller = forwardRef(function Scroller(props: any, ref) {
    return h(Scroll, {
      ...props,
      ref,
      trackStyle: () => ({ width: 6 }),
      thumbStyle: () => ({ width: 6 })
    });
  });
  const view = await render(
    h(List, {
      data: notes,
      components: { Scroller },
      itemContent: (_index: number, note: string) => note
    })
  );
  const scroll = view.get((node) => node.type === "ScrollView");
  expect(scroll.props.testID).toBe("list-scroll");
  expect(textOf(scroll)).toBe("GroceriesIdeasJournal");
});

test("a grouped list draws each group's header before its items", async () => {
  const view = await render(
    h(Grouped, {
      groupCounts: [2, 0, 1],
      groupContent: (index: number) => `[group ${index}]`,
      itemContent: (index: number, groupIndex: number) =>
        `item ${index} of ${groupIndex}`
    })
  );
  expect(rows(view)).toEqual([
    "[group 0]",
    "item 0 of 0",
    "item 1 of 0",
    "[group 1]",
    "[group 2]",
    "item 2 of 2"
  ]);
});

test("a grouped list with no groups shows the EmptyPlaceholder and Footer", async () => {
  const view = await render(
    h(Grouped, {
      groupCounts: [],
      groupContent: () => "group",
      itemContent: () => "item",
      components: {
        EmptyPlaceholder: () => h("Empty", null, "no results"),
        Footer: () => h("Footer", null, "|end")
      }
    })
  );
  expect(view.text()).toBe("no results|end");
});

test("a grouped list scrolls to an item by its index among items, or to a group", async () => {
  const ref = createRef<GroupedVirtuosoHandle>();
  await render(
    h(Grouped, {
      ref,
      groupCounts: [2, 3],
      groupContent: () => null,
      itemContent: () => null
    })
  );
  // Rows: group 0, items 0-1, group 1, items 2-4.
  ref.current!.scrollToIndex(2);
  ref.current!.scrollToIndex({ groupIndex: 1 });
  ref.current!.scrollToIndex({ index: "LAST" });
  ref.current!.scrollToIndex(9);
  expect(state.list.scrollToIndex.map((target) => target.index)).toEqual([
    4, 3, 6
  ]);
});

test("scrollIntoView uses the caller's calculateViewLocation, as the command palette does", async () => {
  const ref = createRef<GroupedVirtuosoHandle>();
  await render(
    h(Grouped, {
      ref,
      groupCounts: [10],
      groupContent: () => null,
      itemContent: () => null
    })
  );
  const seen: any[] = [];
  await settle(() =>
    ref.current!.scrollIntoView({
      index: 3,
      calculateViewLocation: (params) => {
        seen.push(params);
        return { index: 3, align: "start", offset: -30 };
      }
    })
  );
  // Item 3 is row 4 (after its group header): 200..250 in a 0..400 viewport.
  expect(seen[0]).toMatchObject({
    itemTop: 200,
    itemBottom: 250,
    viewportTop: 0,
    viewportBottom: 400,
    locationParams: { index: 3 }
  });
  expect(state.list.scrollToIndex).toEqual([
    { index: 4, animated: false, viewPosition: 0, viewOffset: 30 }
  ]);

  await settle(() =>
    ref.current!.scrollIntoView({ index: 3, calculateViewLocation: () => null })
  );
  expect(state.list.scrollToIndex).toHaveLength(1);
});

test("a table draws its fixed header above the rows, each through TableRow", async () => {
  const view = await render(
    h(Table, {
      data: ["a.png", "b.pdf"],
      context: { selected: "b.pdf" },
      computeItemKey: (index: number) => `file-${index}`,
      fixedHeaderContent: () => h("HeaderRow", null, "Name|"),
      components: {
        Table: (props: any) =>
          h("Table", { style: props.style }, props.children),
        TableRow: (props: any) =>
          h(
            "FileRow",
            { index: props["data-item-index"] },
            props.item === props.context.selected
              ? `*${props.item}`
              : props.item
          )
      }
    })
  );
  const table = view.get((node) => node.type === "Table");
  expect(textOf(table)).toBe("Name|a.png*b.pdf");
  expect(table.props.style).toMatchObject({ flex: 1, flexDirection: "column" });
  expect(rowKeys(view)).toEqual(["file-0", "file-1"]);
});

test("a table without components draws itemContent's cells in a row", async () => {
  const view = await render(
    h(Table, {
      data: ["a.png"],
      itemContent: (index: number, name: string) => `${index}:${name}`
    })
  );
  expect(rows(view)).toEqual(["0:a.png"]);
});
