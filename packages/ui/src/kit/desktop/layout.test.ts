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

import { createElement as h, createRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { UIElement } from "../contracts/elements";
import { ScrollContainer } from "./layout";
import { reset, state } from "./testing/mocks";
import { cleanup, render, settle } from "./testing/render";

vi.mock("react-native", async () =>
  (await import("./testing/mocks")).reactNative()
);
vi.mock("@platform", async () => (await import("./testing/mocks")).platform());
vi.mock("./style/use-styled", async () =>
  (await import("./testing/mocks")).useStyledModule()
);

beforeEach(reset);
afterEach(cleanup);

const Scroll = ScrollContainer as any;

function scrolled(top: number, left = 0) {
  return {
    nativeEvent: {
      contentOffset: { x: left, y: top },
      contentSize: { width: 300, height: 2000 },
      layoutMeasurement: { width: 300, height: 500 }
    }
  };
}

test("calls onScroll with an event whose target reads the new position", async () => {
  const seen: number[] = [];
  const ref = createRef<UIElement>();
  const view = await render(
    h(Scroll, {
      ref,
      "data-test-id": "scroller",
      onScroll: (event: any) => {
        seen.push(event.target.scrollTop);
        expect(event.currentTarget).toBe(ref.current);
      }
    })
  );
  const native = view.byTestId("scroller");
  expect(native.type).toBe("ScrollView");

  await settle(() => native.props.onScroll(scrolled(120)));
  await settle(() => native.props.onScroll(scrolled(340)));
  expect(seen).toEqual([120, 340]);
});

test("the ref reads the scroll position and sizes", async () => {
  const ref = createRef<UIElement>();
  const view = await render(h(Scroll, { ref, "data-test-id": "scroller" }));
  expect(ref.current!.scrollTop).toBe(0);

  await settle(() => view.byTestId("scroller").props.onScroll(scrolled(75, 5)));
  expect(ref.current!.scrollTop).toBe(75);
  expect(ref.current!.scrollLeft).toBe(5);
  expect(ref.current!.scrollHeight).toBe(2000);
  expect(ref.current!.clientHeight).toBe(500);
});

test("writing scrollTop through the ref scrolls the native view", async () => {
  const ref = createRef<UIElement>();
  const view = await render(h(Scroll, { ref, "data-test-id": "scroller" }));
  await settle(() => view.byTestId("scroller").props.onScroll(scrolled(300)));

  ref.current!.scrollTop = 0;
  expect(state.scrollTo).toEqual([{ x: 0, y: 0, animated: false }]);
  expect(ref.current!.scrollTop).toBe(0);

  ref.current!.scrollTo({ top: 250, behavior: "smooth" });
  expect(state.scrollTo[1]).toEqual({ x: 0, y: 250, animated: true });
});

test("a scroll position past the content is clamped to the end", async () => {
  const ref = createRef<UIElement>();
  const view = await render(h(Scroll, { ref, "data-test-id": "scroller" }));
  await settle(() => view.byTestId("scroller").props.onScroll(scrolled(0)));

  ref.current!.scrollTop = 99999;
  expect(ref.current!.scrollTop).toBe(1500);
  ref.current!.scrollTop = -20;
  expect(ref.current!.scrollTop).toBe(0);
});

test("scrolls sideways when only vertical scrolling is suppressed, and not at all when both are", async () => {
  const view = await render(
    h(Scroll, { "data-test-id": "scroller", suppressScrollY: true })
  );
  expect(view.byTestId("scroller").props.horizontal).toBe(true);

  await view.update(
    h(Scroll, {
      "data-test-id": "scroller",
      suppressScrollX: true,
      suppressScrollY: true
    })
  );
  expect(view.byTestId("scroller").props.horizontal).toBe(false);
  expect(view.byTestId("scroller").props.scrollEnabled).toBe(false);
});

test("style is applied over sx, and the deprecated testID still names it", async () => {
  const view = await render(
    h(Scroll, {
      testID: "old-name",
      sx: { maxHeight: 100, flex: 1 },
      style: { maxHeight: 400 }
    })
  );
  expect(view.byTestId("old-name").props.style).toEqual({
    maxHeight: 400,
    flex: 1
  });
});

test("an onScroll that throws does not stop the position from updating", async () => {
  const ref = createRef<UIElement>();
  const view = await render(
    h(Scroll, {
      ref,
      "data-test-id": "scroller",
      onScroll: () => {
        throw new Error("handler failed");
      }
    })
  );
  expect(() => view.byTestId("scroller").props.onScroll(scrolled(60))).toThrow(
    "handler failed"
  );
  expect(ref.current!.scrollTop).toBe(60);
});

test("a scroll event without a native payload is ignored, not a crash", async () => {
  const calls: unknown[] = [];
  const ref = createRef<UIElement>();
  const view = await render(
    h(Scroll, {
      ref,
      "data-test-id": "scroller",
      onScroll: (event: unknown) => calls.push(event)
    })
  );
  view.byTestId("scroller").props.onScroll(undefined);
  view.byTestId("scroller").props.onScroll({});
  expect(calls).toHaveLength(2);
  expect(ref.current!.scrollTop).toBe(0);
});
