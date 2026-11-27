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

import { act, createElement, type ComponentType } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  getDragPayload,
  LAYOUT_DEFAULTS_CSS,
  withKitSx,
  type KitSxOptions
} from "./kit-sx";

type Props = Record<string, any>;

/**
 * Mounts `withKitSx(Probe)` and returns the props the probe received, read
 * again after every update, so state changes are visible.
 */
function mount(props: Props, options?: KitSxOptions) {
  const Probe = (_: Props) => null;
  const Component = withKitSx<ComponentType<Props>>(Probe, options);
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(createElement(Component, props));
  });
  return {
    received: () => renderer.root.findByType(Probe).props as Props,
    // calls a handler the way React does: inside act, so state updates land
    fire: (name: string, event: Props) =>
      act(() => {
        renderer.root.findByType(Probe).props[name](event);
      })
  };
}

function dragEvent(extra: Props = {}) {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { setData: vi.fn(), effectAllowed: "" },
    ...extra
  };
}

describe("withKitSx", () => {
  it("passes theme-ui's props through untouched", () => {
    const onClick = () => undefined;
    const received = mount({
      "data-test-id": "x",
      onClick,
      className: "a",
      title: "t"
    }).received();
    expect(received["data-test-id"]).toBe("x");
    expect(received.onClick).toBe(onClick);
    expect(received.className).toBe("a");
    expect(received.title).toBe("t");
    expect("sx" in received).toBe(false);
  });

  it("does not rename or understand the removed React Native names", () => {
    const onPress = () => undefined;
    const received = mount({
      onPress,
      testID: "t",
      numberOfLines: 2,
      onChangeText: () => undefined
    }).received();
    expect(received.onPress).toBe(onPress);
    expect(received.testID).toBe("t");
    expect(received.onClick).toBeUndefined();
    expect(received["data-test-id"]).toBeUndefined();
    expect(received.sx).toBeUndefined();
    expect(received.onChange).toBeUndefined();
  });

  it("rewrites the kit-only sx shapes into the CSS theme-ui takes", () => {
    const sx = mount({
      sx: {
        ":group-hover": { group: "row", style: { opacity: 1 } },
        ":drag-over": { opacity: 0.5 },
        lineClamp: 2
      }
    }).received().sx;
    expect(sx[".nn-group-row:hover &"]).toEqual({ opacity: 1 });
    expect(sx["&[data-drag-over]"]).toEqual({ opacity: 0.5 });
    expect(sx[":group-hover"]).toBeUndefined();
    expect(sx[":drag-over"]).toBeUndefined();
    expect(sx.WebkitLineClamp).toBe(2);
    expect(sx.lineClamp).toBeUndefined();
  });

  it("turns group into the class that :group-hover selects on", () => {
    const received = mount({ group: "row", className: "a" }).received();
    expect(received.className).toBe("a nn-group-row");
    expect(received).not.toHaveProperty("group");
  });

  it("gives the layout class, and a Box with display flex the row class", () => {
    expect(mount({}, { className: "nn-box" }).received().className).toBe(
      "nn-box"
    );
    expect(
      mount(
        { sx: { display: "flex" }, className: "mine" },
        { className: "nn-box" }
      ).received().className
    ).toBe("mine nn-flex");
  });

  it("applies default styles and props under the caller's own", () => {
    expect(
      mount({ sx: { p: 1 } }, { sx: { display: "flex", p: 0 } }).received().sx
    ).toEqual({ display: "flex", p: 1 });

    const link = { target: "_blank", rel: "noreferrer" };
    expect(mount({}, { defaults: link }).received()).toMatchObject(link);
    expect(
      mount({ target: "_self" }, { defaults: link }).received().target
    ).toBe("_self");
  });

  it("selectable makes the text selectable, under the caller's sx", () => {
    expect(mount({ selectable: true }).received().sx).toEqual({
      userSelect: "text"
    });
    expect(
      mount({ selectable: true, sx: { userSelect: "none" } }).received().sx
    ).toEqual({ userSelect: "none" });
    expect(mount({}).received().sx).toBeUndefined();
  });

  it("focusable={false} keeps the element out of the tab order and the focus where it is", () => {
    const onMouseDown = vi.fn();
    const received = mount({ focusable: false, onMouseDown }).received();
    expect(received.tabIndex).toBe(-1);
    const event = { preventDefault: vi.fn() };
    received.onMouseDown(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(onMouseDown).toHaveBeenCalledWith(event);
    expect(mount({}).received().tabIndex).toBeUndefined();
  });

  it("selectTextOnFocus selects the text on focus, then calls the caller's onFocus", () => {
    const calls: string[] = [];
    const onFocus = vi.fn(() => calls.push("focus"));
    const select = vi.fn(() => calls.push("select"));
    mount({ selectTextOnFocus: true, onFocus })
      .received()
      .onFocus({ currentTarget: { select } });
    expect(select).toHaveBeenCalledOnce();
    expect(onFocus).toHaveBeenCalledOnce();
    expect(calls).toEqual(["select", "focus"]);
  });

  it("gives pointer events x and y relative to the element", () => {
    const onPointerMove = vi.fn();
    const event = {
      clientX: 30,
      clientY: 50,
      currentTarget: { getBoundingClientRect: () => ({ left: 10, top: 20 }) }
    };
    mount({ onPointerMove }).received().onPointerMove(event);
    expect(onPointerMove).toHaveBeenCalledOnce();
    expect(event).toMatchObject({ x: 20, y: 30, clientX: 30 });
  });

  it("hands what onDragStart returns to the drag ghost, and clears it at the end", () => {
    const onDragEnd = vi.fn();
    const props = {
      draggable: true,
      onDragStart: () => ({ ghost: "note" }),
      onDragEnd
    };
    const received = mount(props).received();
    const event = dragEvent();
    received.onDragStart(event);
    expect(getDragPayload()).toEqual({ ghost: "note" });
    expect(event.dataTransfer.setData).toHaveBeenCalledWith(
      "text/plain",
      "nn-drag"
    );
    expect(event.dataTransfer.effectAllowed).toBe("move");

    received.onDragEnd(dragEvent());
    expect(getDragPayload()).toBeUndefined();
    expect(onDragEnd).toHaveBeenCalledOnce();
  });

  it("leaves the data transfer alone when onDragStart returns nothing", () => {
    const received = mount({
      draggable: true,
      onDragStart: () => undefined
    }).received();
    const event = dragEvent();
    received.onDragStart(event);
    expect(getDragPayload()).toBeUndefined();
    expect(event.dataTransfer.setData).not.toHaveBeenCalled();
  });

  it("marks a drop target :drag-over while a drag is over it, and clears it on drop", () => {
    const onDrop = vi.fn();
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    const view = mount({ onDrop, onDragEnter, onDragLeave });
    const attribute = () => view.received()["data-drag-over"];
    expect(attribute()).toBeUndefined();

    const enter = dragEvent();
    view.fire("onDragEnter", enter);
    expect(enter.preventDefault).toHaveBeenCalled();
    expect(attribute()).toBe("");
    expect(onDragEnter).toHaveBeenCalledOnce();

    // a child entering and leaving does not end the drag over the target
    view.fire("onDragEnter", dragEvent());
    view.fire("onDragLeave", dragEvent());
    expect(attribute()).toBe("");
    expect(onDragLeave).not.toHaveBeenCalled();

    view.fire("onDragLeave", dragEvent());
    expect(attribute()).toBeUndefined();
    expect(onDragLeave).toHaveBeenCalledOnce();

    view.fire("onDragEnter", dragEvent());
    expect(attribute()).toBe("");

    const drop = dragEvent();
    view.fire("onDrop", drop);
    expect(drop.preventDefault).toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalledWith(drop);
    expect(attribute()).toBeUndefined();
  });

  it("accepts drops only where onDrop is set, and leaves other drag handlers alone", () => {
    const onDragEnter = vi.fn();
    const received = mount({ onDragEnter }).received();
    expect(received["data-drag-over"]).toBeUndefined();
    expect(received.onDragEnter).toBe(onDragEnter);
    expect(received.onDrop).toBeUndefined();
  });

  it("accepts a drop unless the element's own onDragOver refuses it", () => {
    const onDragOver = vi.fn();
    const refusing = mount({ onDrop: vi.fn(), onDragOver });
    const refused = dragEvent();
    refusing.fire("onDragOver", refused);
    expect(onDragOver).toHaveBeenCalledWith(refused);
    expect(refused.preventDefault).not.toHaveBeenCalled();

    const accepting = mount({
      onDrop: vi.fn(),
      onDragOver: (event: any) => event.preventDefault()
    });
    const accepted = dragEvent();
    accepting.fire("onDragOver", accepted);
    expect(accepted.preventDefault).toHaveBeenCalledOnce();

    const plain = mount({ onDrop: vi.fn() });
    const event = dragEvent();
    plain.fire("onDragOver", event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
});

describe("the layout defaults", () => {
  it("draw Box as a column flexbox and Flex as a row", () => {
    expect(LAYOUT_DEFAULTS_CSS).toContain(
      ":where(.nn-box,.nn-flex){display:flex;flex-direction:column"
    );
    expect(LAYOUT_DEFAULTS_CSS).toContain(
      ":where(.nn-flex){flex-direction:row}"
    );
  });
});
