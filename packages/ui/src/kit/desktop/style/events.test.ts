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
import { elementFor } from "../element";
import {
  changeEvent,
  DesktopDataTransfer,
  dragEvent,
  focusEvent,
  isKeyPress,
  keyboardEvent,
  lastPointer,
  mouseEvent,
  syntheticEvent,
  toUIFile,
  touchEvent,
  wheelEvent
} from "./events";

const MODIFIERS = ["shiftKey", "ctrlKey", "altKey", "metaKey"];
const BASE = ["target", "currentTarget", "preventDefault", "stopPropagation"];

function native(nativeEvent: Record<string, unknown>, extra = {}) {
  return {
    nativeEvent,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extra
  };
}

describe("every event", () => {
  it("has target, currentTarget, preventDefault and stopPropagation", () => {
    const outer = {};
    const inner = {};
    const source = native({}, { target: inner, currentTarget: outer });
    const event = syntheticEvent("click", source);
    for (const member of BASE) expect(event, member).toHaveProperty(member);
    expect(event.currentTarget).toBe(elementFor(outer));
    expect(event.target).toBe(elementFor(inner));
    expect(event.currentTarget.contains(event.target)).toBe(false);
  });

  it("forwards preventDefault and stopPropagation and remembers them", () => {
    const source = native({});
    const event = syntheticEvent("click", source);
    expect(event.defaultPrevented).toBe(false);
    event.preventDefault();
    event.stopPropagation();
    expect(source.preventDefault).toHaveBeenCalledOnce();
    expect(source.stopPropagation).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(event.isDefaultPrevented()).toBe(true);
    expect(event.isPropagationStopped()).toBe(true);
  });

  it("still has usable targets when the native event has none", () => {
    for (const source of [undefined, {}, { nativeEvent: {} }]) {
      const event = syntheticEvent("click", source);
      expect(event.target).toBe(event.currentTarget);
      expect(() => event.currentTarget.getBoundingClientRect()).not.toThrow();
      expect(() => event.preventDefault()).not.toThrow();
      expect(() => event.stopPropagation()).not.toThrow();
    }
  });
});

describe("mouse events", () => {
  it("have the DOM's members, from a press", () => {
    const event = mouseEvent(
      "click",
      native({
        pageX: 40,
        pageY: 50,
        locationX: 4,
        locationY: 5,
        metaKey: true
      }),
      { button: 0, detail: 1 }
    );
    for (const member of [
      ...BASE,
      ...MODIFIERS,
      "button",
      "buttons",
      "detail",
      "clientX",
      "clientY",
      "pageX",
      "pageY"
    ])
      expect(event, member).toHaveProperty(member);
    expect(event).toMatchObject({
      type: "click",
      button: 0,
      buttons: 0,
      detail: 1,
      clientX: 40,
      clientY: 50,
      pageX: 40,
      pageY: 50,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: true
    });
  });

  it("read the button and position of a pointer event", () => {
    const event = mouseEvent(
      "mousedown",
      native({
        button: 2,
        buttons: 2,
        clientX: 7,
        clientY: 8,
        pageX: 7,
        pageY: 8
      })
    );
    expect(event).toMatchObject({
      button: 2,
      buttons: 2,
      clientX: 7,
      clientY: 8
    });
    // A move has no button; the DOM says 0 there, never -1.
    expect(mouseEvent("mousemove", native({ button: -1 })).button).toBe(0);
  });

  it("take the position of a context menu event, which only has x and y", () => {
    const event = mouseEvent("contextmenu", native({ x: 11, y: 12 }), {
      button: 2
    });
    expect(event).toMatchObject({
      clientX: 11,
      clientY: 12,
      pageX: 11,
      button: 2
    });
    expect(lastPointer).toEqual({ x: 11, y: 12 });
  });

  it("keep preventDefault working after the mouse members are added", () => {
    const source = native({});
    const event = mouseEvent("click", source);
    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
    expect(source.preventDefault).toHaveBeenCalledOnce();
  });
});

describe("keyboard events", () => {
  it("have key, code, repeat, the modifiers and a nativeEvent", () => {
    const source = native({
      key: "Enter",
      code: "Enter",
      repeat: true,
      shiftKey: true
    });
    const event = keyboardEvent("keydown", source);
    for (const member of [...BASE, ...MODIFIERS, "key", "code", "repeat"])
      expect(event, member).toHaveProperty(member);
    expect(event).toMatchObject({
      key: "Enter",
      code: "Enter",
      repeat: true,
      shiftKey: true,
      ctrlKey: false
    });
    expect(event.nativeEvent).toMatchObject({
      key: "Enter",
      code: "Enter",
      repeat: true,
      shiftKey: true
    });
    event.nativeEvent.stopPropagation();
    expect(source.stopPropagation).toHaveBeenCalledOnce();
    expect(event.isPropagationStopped()).toBe(true);
  });

  it("read a bare payload, as the list passes it", () => {
    expect(keyboardEvent("keydown", { key: "ArrowDown" } as never).key).toBe(
      "ArrowDown"
    );
    expect(keyboardEvent("keydown", undefined)).toMatchObject({
      key: "",
      code: "",
      repeat: false
    });
  });

  it("give nativeEvent the legacy keyCode the key handler falls back to", () => {
    expect(
      keyboardEvent("keydown", { key: "a", keyCode: 65 } as never).nativeEvent
        .keyCode
    ).toBe(65);
    expect(keyboardEvent("keydown", undefined).nativeEvent.keyCode).toBe(0);
  });

  it("count as a key press only for characters and Enter", () => {
    expect(isKeyPress("a")).toBe(true);
    expect(isKeyPress(" ")).toBe(true);
    expect(isKeyPress("Enter")).toBe(true);
    expect(isKeyPress("Escape")).toBe(false);
    expect(isKeyPress("ArrowUp")).toBe(false);
    expect(isKeyPress(undefined)).toBe(false);
  });
});

describe("focus, wheel and touch events", () => {
  it("focus events target the element the handler is on", () => {
    const host = {};
    const event = focusEvent(
      "focus",
      native({}, { target: {}, currentTarget: host })
    );
    expect(event.target).toBe(elementFor(host));
    expect(event.currentTarget).toBe(elementFor(host));
    expect(event.relatedTarget).toBeNull();
  });

  it("wheel events have deltas on top of the mouse members", () => {
    const event = wheelEvent(native({ deltaX: 1, deltaY: -30, ctrlKey: true }));
    expect(event).toMatchObject({ deltaX: 1, deltaY: -30, ctrlKey: true });
    expect(event).toHaveProperty("clientX");
    expect(wheelEvent(native({}))).toMatchObject({ deltaX: 0, deltaY: 0 });
  });

  it("touch events list their touches", () => {
    const touch = { identifier: 3, pageX: 9, pageY: 8 };
    const event = touchEvent(
      "touchstart",
      native({ touches: [touch], changedTouches: [touch] })
    );
    expect(event.touches).toEqual([
      { identifier: 3, clientX: 9, clientY: 8, pageX: 9, pageY: 8 }
    ]);
    expect(event.changedTouches).toHaveLength(1);
    expect(touchEvent("touchend", native({})).touches).toEqual([]);
  });
});

describe("change events", () => {
  it("target the control, so the handler reads value and checked", () => {
    const element = elementFor({}, { value: "typed", checked: true })!;
    const event = changeEvent(element);
    for (const member of BASE) expect(event, member).toHaveProperty(member);
    expect(event.target).toBe(element);
    expect(event.currentTarget).toBe(element);
    expect((event.target as typeof element).value).toBe("typed");
    expect((event.target as typeof element).checked).toBe(true);
  });

  it("do not throw without an element", () => {
    const event = changeEvent<{ value: string }>(null);
    expect(event.target.value).toBe("");
    expect(() => event.stopPropagation()).not.toThrow();
  });
});

describe("drag events", () => {
  it("carry a dataTransfer that keeps what was set", () => {
    const store = new Map<string, string>();
    const start = dragEvent(
      "dragstart",
      native({ pageX: 1, pageY: 2 }),
      new DesktopDataTransfer(store)
    );
    start.dataTransfer.setData("application/x-note", "id-1");
    start.dataTransfer.setData("text", "plain");

    const drop = dragEvent(
      "drop",
      native({ x: 5, y: 6, pageX: 5, pageY: 6, dropped: true }),
      new DesktopDataTransfer(store)
    );
    for (const member of [...BASE, "dataTransfer", "clientX", "clientY"])
      expect(drop, member).toHaveProperty(member);
    expect(drop.dataTransfer.getData("application/x-note")).toBe("id-1");
    expect(drop.dataTransfer.getData("text/plain")).toBe("plain");
    expect(drop.dataTransfer.getData("missing")).toBe("");
    expect(drop.dataTransfer.types).toEqual([
      "application/x-note",
      "text/plain"
    ]);
    expect(drop.dataTransfer.files).toHaveLength(0);
    expect(drop).not.toHaveProperty("payload");
    expect(drop).not.toHaveProperty("dropped");

    drop.dataTransfer.clearData("text");
    expect(drop.dataTransfer.types).toEqual(["application/x-note"]);
    drop.dataTransfer.clearData();
    expect(drop.dataTransfer.types).toEqual([]);
  });

  it("list dropped files as File-like objects", async () => {
    const file = toUIFile({
      name: "a.txt",
      size: 2,
      type: "text/plain",
      uri: "file:///a.txt",
      text: async () => "hi",
      bytes: async () => new Uint8Array([104, 105])
    });
    const transfer = new DesktopDataTransfer(new Map(), [file]);
    expect(transfer.types).toEqual(["Files"]);
    expect(transfer.files[0]).toMatchObject({
      name: "a.txt",
      size: 2,
      type: "text/plain"
    });
    expect(await transfer.files[0].text()).toBe("hi");
    const buffer = await transfer.files[0].arrayBuffer();
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect([...new Uint8Array(buffer)]).toEqual([104, 105]);
    // The deprecated reader is kept on the same object.
    expect(await file.bytes()).toEqual(new Uint8Array([104, 105]));
  });
});
