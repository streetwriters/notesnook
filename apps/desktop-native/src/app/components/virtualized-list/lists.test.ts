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

// The app's list wrappers on the kit's react-virtuoso API. `Virtuoso` here is
// a stand-in that draws what react-virtuoso would (the Header with the
// context, then one row per index from computeItemKey and itemContent) and
// records its props; the kit's own tests cover the real lists.
/* eslint-disable no-restricted-imports, no-restricted-globals -- a unit test, rendered on Node */
import * as React from "react";
import { createElement as h, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
import { VirtualizedList } from ".";
import { VirtualizedGrid } from "../virtualized-grid";
import { VirtualizedTable } from "../virtualized-table";

// Unit tests compile the app's JSX to `React.createElement`.
(globalThis as { React?: typeof React }).React = React;

const seen: { props?: Record<string, any> } = {};

vi.mock("@notesnook/ui-kit", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, any>) =>
    createElement(
      "div",
      {
        "data-test-id": props["data-test-id"],
        "data-sx": JSON.stringify(props.sx)
      },
      props.children
    );
  function Virtuoso(props: Record<string, any>) {
    seen.props = props;
    const Header: ComponentType<{ context: unknown }> | undefined =
      props.components?.Header;
    const rows: ReactNode[] = [];
    for (let index = 0; index < (props.totalCount ?? 0); index++) {
      const key = String(props.computeItemKey(index, undefined, props.context));
      rows.push(
        createElement(
          "div",
          { key, "data-key": key },
          props.itemContent(index, undefined, props.context)
        )
      );
    }
    return createElement(
      "div",
      { "data-test-id": props["data-test-id"] },
      Header ? createElement(Header, { context: props.context }) : null,
      rows
    );
  }
  return { Box: box, Flex: box, Virtuoso };
});

beforeEach(() => {
  seen.props = undefined;
});

const notes = [
  { id: "n1", title: "Groceries" },
  { id: "n2", title: "Ideas" },
  { id: "n3", title: "Journal" }
];
type Note = (typeof notes)[number];

const keys = (html: string) =>
  [...html.matchAll(/data-key="([^"]+)"/g)].map((match) => match[1]);
const text = (html: string) => html.replace(/<[^>]+>/g, "");

test("VirtualizedList draws a row per item, keyed by getItemKey, under its header", () => {
  const html = renderToStaticMarkup(
    h(VirtualizedList<Note, { prefix: string }>, {
      items: notes,
      estimatedSize: 30,
      getItemKey: (index, items) => items[index].id,
      context: { prefix: "#" },
      header: "Pinned",
      renderItem: ({ item, index, context }) =>
        `${context.prefix}${index} ${item.title}`
    })
  );
  expect(keys(html)).toEqual(["n1", "n2", "n3"]);
  expect(text(html)).toBe("Pinned#0 Groceries#1 Ideas#2 Journal");
  expect(html).toContain('data-test-id="virtualized-list"');
  expect(seen.props).toMatchObject({
    totalCount: 3,
    defaultItemHeight: 30,
    increaseViewportBy: 400
  });
});

test("VirtualizedList puts data-test-id and sx on its container, adds the gap to each row's height, and has no header unless given one", () => {
  const html = renderToStaticMarkup(
    h(VirtualizedList<Note, unknown>, {
      items: notes,
      estimatedSize: 30,
      itemGap: 4,
      overscan: 100,
      getItemKey: (index, items) => items[index].id,
      renderItem: ({ item }) => item.title,
      "data-test-id": "attachments",
      sx: { height: 200 }
    })
  );
  expect(html).toContain('data-test-id="attachments"');
  expect(html).not.toContain('data-test-id="virtualized-list"');
  expect(html).toContain("&quot;height&quot;:200");
  expect(text(html)).toBe("GroceriesIdeasJournal");
  expect(seen.props?.components?.Header).toBeUndefined();
  expect(seen.props).toMatchObject({
    defaultItemHeight: 34,
    increaseViewportBy: 100
  });
});

test("VirtualizedGrid draws rows of `columns` cells and asks for more at the last row", () => {
  const onEndReached = vi.fn();
  const html = renderToStaticMarkup(
    h(VirtualizedGrid<Note>, {
      items: notes,
      columns: 2,
      estimatedSize: 100,
      getItemKey: (index) => notes[index].id,
      renderItem: ({ item }) => item.title,
      onEndReached
    })
  );
  expect(keys(html)).toEqual(["row-n1", "row-n3"]);
  expect(text(html)).toBe("GroceriesIdeasJournal");
  expect(html).toContain('data-test-id="virtualized-grid"');
  expect(seen.props).toMatchObject({ totalCount: 2, defaultItemHeight: 100 });
  expect(onEndReached).toHaveBeenCalledOnce();
});

test("VirtualizedTable draws its header and a row per item", () => {
  const html = renderToStaticMarkup(
    h(VirtualizedTable<Note, unknown>, {
      items: notes,
      estimatedSize: 25,
      getItemKey: (index) => notes[index].id,
      header: "Name",
      renderRow: ({ item }) => item.title
    })
  );
  expect(keys(html)).toEqual(["n1", "n2", "n3"]);
  expect(text(html)).toBe("NameGroceriesIdeasJournal");
  expect(html).toContain('data-test-id="virtualized-table"');
});
