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

import { act, createElement, createRef, type Ref } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VirtualListHandle, VirtualListProps } from "../contracts/lists";
import { VirtualList } from "./lists";

// jsdom has no layout, so react-virtuoso cannot measure rows here. This stand-in
// records the props VirtualList hands Virtuoso and answers scrollToIndex, so the
// tests cover VirtualList's own wiring, not Virtuoso's layout.
const virtuoso = vi.hoisted(() => ({
  props: undefined as Record<string, any> | undefined,
  scrollToIndex: vi.fn()
}));

vi.mock("react-virtuoso", async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import(
    "react"
  );
  const Virtuoso = forwardRef<unknown, Record<string, any>>(function Virtuoso(
    props,
    ref
  ) {
    virtuoso.props = props;
    useImperativeHandle(
      ref,
      () => ({ scrollToIndex: virtuoso.scrollToIndex }),
      []
    );
    const Header = props.components?.Header;
    return Header ? createElement(Header, { context: props.context }) : null;
  });
  return { Virtuoso, GroupedVirtuoso: Virtuoso, TableVirtuoso: Virtuoso };
});

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  virtuoso.props = undefined;
  virtuoso.scrollToIndex.mockClear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function list(props: Partial<VirtualListProps>, ref?: Ref<VirtualListHandle>) {
  return createElement(VirtualList, {
    ref,
    count: 3,
    renderItem: (index: number) => `row ${index}`,
    itemKey: (index: number) => `key-${index}`,
    estimatedItemSize: 40,
    ...props
  });
}

describe("web VirtualList", () => {
  it("hands Virtuoso the count, keys, rows and sizing it was given", () => {
    act(() => {
      root.render(list({ initialScrollIndex: 2, overscan: 80 }));
    });

    const props = virtuoso.props!;
    expect(props.totalCount).toBe(3);
    expect(props.computeItemKey(1)).toBe("key-1");
    expect(props.itemContent(2)).toBe("row 2");
    expect(props.defaultItemHeight).toBe(40);
    expect(props.increaseViewportBy).toBe(80);
    expect(props.initialTopMostItemIndex).toBe(2);
  });

  it("renders the header in Virtuoso's Header slot", () => {
    act(() => {
      root.render(list({ header: createElement("h2", null, "Notes header") }));
    });

    expect(container.textContent).toContain("Notes header");
  });

  it("renders no header slot when there is no header", () => {
    act(() => {
      root.render(list({}));
    });

    expect(virtuoso.props!.components).toEqual({});
    expect(container.textContent).not.toContain("Notes header");
  });

  it("maps scrollToIndex to Virtuoso's align and smooth or instant behaviour", () => {
    const ref = createRef<VirtualListHandle>();
    act(() => {
      root.render(list({}, ref));
    });

    ref.current!.scrollToIndex({ index: 4, align: "center", animated: true });
    ref.current!.scrollToIndex({ index: 1, align: "start", animated: false });

    expect(virtuoso.scrollToIndex).toHaveBeenNthCalledWith(1, {
      index: 4,
      align: "center",
      behavior: "smooth"
    });
    expect(virtuoso.scrollToIndex).toHaveBeenNthCalledWith(2, {
      index: 1,
      align: "start",
      behavior: "auto"
    });
  });

  it("forwards onKeyDown as the same handler and calls onBlur", () => {
    const onKeyDown = vi.fn();
    const onBlur = vi.fn();
    act(() => {
      root.render(list({ onKeyDown, onBlur }));
    });

    expect(virtuoso.props!.onKeyDown).toBe(onKeyDown);
    virtuoso.props!.onBlur();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
