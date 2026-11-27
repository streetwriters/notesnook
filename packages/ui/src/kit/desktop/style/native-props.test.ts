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

import { describe, expect, it, vi } from "vitest";
import {
  nativeEventProps,
  pressHandler,
  testIdOf,
  type NativeHost
} from "./native-props";

function host(payload?: unknown): NativeHost & { payload: unknown } {
  return {
    payload,
    getPayload() {
      return this.payload;
    },
    setPayload(next) {
      this.payload = next;
    },
    toFile: (path, size) => ({
      name: path.split("/").pop()!,
      size,
      type: "text/plain",
      uri: `file://${path}`,
      text: async () => "",
      bytes: async () => new Uint8Array()
    })
  };
}

function call(props: Record<string, unknown>, name: string, event: object) {
  const handler = props[name] as ((event: object) => void) | undefined;
  expect(handler, name).toBeTypeOf("function");
  handler!(event);
}

describe("attributes", () => {
  it("reads the test id from data-test-id only", () => {
    expect(testIdOf({ "data-test-id": "new" })).toBe("new");
    expect(testIdOf({ testID: "old" } as never)).toBeUndefined();
    expect(testIdOf({})).toBeUndefined();
    expect(nativeEventProps({ "data-test-id": "save" }, host()).testID).toBe(
      "save"
    );
    expect(
      nativeEventProps({ testID: "save" } as never, host()).testID
    ).toBeUndefined();
  });

  it("maps id, title, aria-label, aria-hidden and tabIndex", () => {
    expect(
      nativeEventProps(
        {
          id: "a",
          title: "Tip",
          "aria-label": "Close",
          "aria-hidden": "true",
          tabIndex: 0,
          className: "ignored"
        },
        host()
      )
    ).toEqual({
      nativeID: "a",
      tooltip: "Tip",
      accessibilityLabel: "Close",
      accessibilityElementsHidden: true,
      focusable: true
    });
  });

  it("gives nothing for an element with no handlers or attributes", () => {
    expect(nativeEventProps({}, host())).toEqual({});
  });
});

describe("handlers receive DOM-shaped events", () => {
  it("onMouseEnter and onMouseLeave get mouse events", () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const props = nativeEventProps({ onMouseEnter, onMouseLeave }, host());
    call(props, "onPointerEnter", { nativeEvent: { pageX: 3, pageY: 4 } });
    call(props, "onPointerLeave", { nativeEvent: { pageX: 5, pageY: 6 } });
    expect(onMouseEnter.mock.calls[0][0]).toMatchObject({
      type: "mouseenter",
      clientX: 3,
      clientY: 4,
      button: 0
    });
    expect(onMouseEnter.mock.calls[0][0]).toHaveProperty("currentTarget");
    expect(onMouseLeave.mock.calls[0][0]).toMatchObject({ clientX: 5 });
  });

  it("onMouseDown, onMouseMove and onMouseUp get the button", () => {
    const handlers = {
      onMouseDown: vi.fn(),
      onMouseMove: vi.fn(),
      onMouseUp: vi.fn()
    };
    const props = nativeEventProps(handlers, host());
    call(props, "onPointerDown", { nativeEvent: { button: 0, buttons: 1 } });
    call(props, "onPointerMove", { nativeEvent: { button: -1, buttons: 1 } });
    call(props, "onPointerUp", { nativeEvent: { button: 0, buttons: 0 } });
    expect(handlers.onMouseDown.mock.calls[0][0]).toMatchObject({
      button: 0,
      buttons: 1
    });
    expect(handlers.onMouseMove.mock.calls[0][0]).toMatchObject({
      button: 0,
      buttons: 1
    });
    expect(handlers.onMouseUp).toHaveBeenCalledOnce();
  });

  it("onAuxClick fires for the middle and right buttons only", () => {
    const onAuxClick = vi.fn();
    const props = nativeEventProps({ onAuxClick }, host());
    call(props, "onPointerUp", { nativeEvent: { button: 0 } });
    expect(onAuxClick).not.toHaveBeenCalled();
    call(props, "onPointerUp", { nativeEvent: { button: 1 } });
    expect(onAuxClick.mock.calls[0][0]).toMatchObject({ button: 1 });
  });

  it("onContextMenu gets a right-button mouse event that can be prevented", () => {
    const onContextMenu = vi.fn((event) => event.preventDefault());
    const preventDefault = vi.fn();
    const props = nativeEventProps({ onContextMenu }, host());
    call(props, "onContextMenu", {
      nativeEvent: { x: 9, y: 8 },
      preventDefault
    });
    expect(onContextMenu.mock.calls[0][0]).toMatchObject({
      button: 2,
      clientX: 9,
      clientY: 8
    });
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("onKeyDown, onKeyUp and onKeyPress get keyboard events", () => {
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    const onKeyPress = vi.fn();
    const props = nativeEventProps({ onKeyDown, onKeyUp, onKeyPress }, host());
    expect(props.focusable).toBe(true);
    call(props, "onKeyDown", { nativeEvent: { key: "a", code: "KeyA" } });
    call(props, "onKeyDown", { nativeEvent: { key: "Escape" } });
    call(props, "onKeyUp", { nativeEvent: { key: "a", code: "KeyA" } });
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(onKeyDown.mock.calls[0][0]).toMatchObject({
      key: "a",
      code: "KeyA"
    });
    expect(onKeyUp.mock.calls[0][0]).toMatchObject({ key: "a" });
    expect(onKeyPress).toHaveBeenCalledOnce();
    expect(onKeyPress.mock.calls[0][0]).toMatchObject({ key: "a" });
  });

  it("onFocus, onBlur, onWheel and the touch handlers get their events", () => {
    const handlers = {
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onWheel: vi.fn(),
      onTouchStart: vi.fn()
    };
    const props = nativeEventProps(handlers, host());
    const target = {};
    call(props, "onFocus", { nativeEvent: {}, currentTarget: target });
    call(props, "onBlur", { nativeEvent: {} });
    call(props, "onWheel", { nativeEvent: { deltaY: 12 } });
    call(props, "onTouchStart", { nativeEvent: { touches: [{ pageX: 1 }] } });
    const focus = handlers.onFocus.mock.calls[0][0];
    expect(focus.target).toBe(focus.currentTarget);
    expect(handlers.onBlur.mock.calls[0][0]).toHaveProperty("target");
    expect(handlers.onWheel.mock.calls[0][0]).toMatchObject({ deltaY: 12 });
    expect(handlers.onTouchStart.mock.calls[0][0].touches).toHaveLength(1);
  });
});

describe("clicks", () => {
  it("onClick gets a mouse event with the primary button", () => {
    const onClick = vi.fn();
    pressHandler({ onClick })!({
      nativeEvent: { pageX: 30, pageY: 40, shiftKey: true }
    });
    const event = onClick.mock.calls[0][0];
    expect(event).toMatchObject({
      type: "click",
      button: 0,
      detail: 1,
      clientX: 30,
      clientY: 40,
      shiftKey: true
    });
    expect(event).toHaveProperty("target");
    expect(event).toHaveProperty("currentTarget");
    expect(event.preventDefault).toBeTypeOf("function");
  });

  it("is not pressable without a click handler", () => {
    expect(pressHandler({})).toBeUndefined();
    expect(pressHandler({ onMouseDown: () => {} })).toBeUndefined();
  });

  it("raises onDoubleClick on a second press within 400 ms, across renders", () => {
    const onClick = vi.fn();
    const onDoubleClick = vi.fn();
    const state = { last: 0 };
    let time = 1000;
    const press = () =>
      // A new handler each time, as each render makes one.
      pressHandler({ onClick, onDoubleClick }, state, () => time)!({
        nativeEvent: {}
      });
    press();
    time += 200;
    press();
    expect(onDoubleClick).toHaveBeenCalledOnce();
    expect(onDoubleClick.mock.calls[0][0]).toMatchObject({
      type: "dblclick",
      detail: 2
    });
    expect(onClick.mock.calls.map(([event]) => event.detail)).toEqual([1, 2]);
    time += 200;
    press();
    expect(onDoubleClick).toHaveBeenCalledOnce();
    time += 1000;
    press();
    expect(onDoubleClick).toHaveBeenCalledOnce();
  });
});

describe("handlers", () => {
  it("onPointerDown still gets the pointer event next to onMouseDown", () => {
    const onPointerDown = vi.fn();
    const onMouseDown = vi.fn();
    const props = nativeEventProps({ onPointerDown, onMouseDown }, host());
    call(props, "onPointerDown", {
      nativeEvent: {
        locationX: 2,
        locationY: 3,
        pageX: 20,
        pageY: 30,
        buttons: 1
      }
    });
    expect(onPointerDown).toHaveBeenCalledWith({
      x: 2,
      y: 3,
      pageX: 20,
      pageY: 30,
      buttons: 1
    });
    expect(onMouseDown).toHaveBeenCalledOnce();
  });

  it("onDragStart's return value is kept for the drag ghost", () => {
    const platform = host("stale");
    const source = nativeEventProps(
      { draggable: true, onDragStart: () => ({ id: "note-1" }) },
      platform
    );
    expect(source.draggable).toBe(true);
    call(source, "onDragStart", { nativeEvent: {} });
    expect(platform.payload).toEqual({ id: "note-1" });

    const onDrop = vi.fn();
    const target = nativeEventProps({ onDrop }, platform);
    expect(target.droppable).toBe(true);
    call(target, "onDrop", { nativeEvent: { x: 1, y: 2 } });
    expect(onDrop.mock.calls[0][0]).toMatchObject({ clientX: 1, clientY: 2 });
    expect(onDrop.mock.calls[0][0]).not.toHaveProperty("payload");
  });

  it("a draggable without onDragStart clears the payload", () => {
    const platform = host("stale");
    call(nativeEventProps({ draggable: true }, platform), "onDragStart", {});
    expect(platform.payload).toBeUndefined();
  });
});

describe("drag and drop on the new API", () => {
  it("an element with onDrop accepts drops and files without the old props", () => {
    const props = nativeEventProps({ onDrop: () => {} }, host());
    expect(props.droppable).toBe(true);
    expect(props.acceptsFiles).toBe(true);
  });

  it("data set on dragstart is read on drop, and the next drag starts clean", () => {
    const platform = host();
    const onDrop = vi.fn();
    const source = nativeEventProps(
      {
        draggable: true,
        onDragStart: (event) => {
          event.dataTransfer.setData("text/plain", "dragged");
        }
      },
      platform
    );
    const target = nativeEventProps({ onDrop }, platform);
    call(source, "onDragStart", { nativeEvent: {} });
    call(target, "onDrop", { nativeEvent: {} });
    expect(onDrop.mock.calls[0][0].dataTransfer.getData("text/plain")).toBe(
      "dragged"
    );

    call(nativeEventProps({ draggable: true }, platform), "onDragStart", {});
    call(target, "onDrop", { nativeEvent: {} });
    expect(onDrop.mock.calls[1][0].dataTransfer.getData("text/plain")).toBe("");
  });

  it("dropped files are on dataTransfer.files", () => {
    const onDrop = vi.fn();
    const props = nativeEventProps({ onDrop }, host());
    call(props, "onDrop", {
      nativeEvent: { files: [{ path: "/tmp/a.txt", size: 3 }] }
    });
    const { dataTransfer } = onDrop.mock.calls[0][0];
    expect(dataTransfer.types).toContain("Files");
    expect(dataTransfer.files[0]).toMatchObject({ name: "a.txt", size: 3 });
    expect(dataTransfer.files[0].arrayBuffer).toBeTypeOf("function");
  });
});
