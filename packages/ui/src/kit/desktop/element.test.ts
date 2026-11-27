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

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DesktopElement,
  elementFor,
  getElementById,
  registerElementId,
  setScrollCommand,
  type ElementControl,
  type NativeNode
} from "./element";

function node(
  rect: { x: number; y: number; width: number; height: number },
  extra: Partial<NativeNode> = {}
): NativeNode {
  return { getBoundingClientRect: () => rect, ...extra };
}

afterEach(() => setScrollCommand(undefined));

describe("a ref to a desktop primitive", () => {
  it("has every member of the HTMLElement subset in the contract", () => {
    const element = elementFor({})!;
    for (const method of [
      "focus",
      "blur",
      "getBoundingClientRect",
      "scrollIntoView",
      "scrollTo",
      "contains",
      "measureInWindow",
      "select",
      "setSelectionRange"
    ] as const)
      expect(typeof element[method], method).toBe("function");
    for (const size of [
      "scrollTop",
      "scrollLeft",
      "scrollHeight",
      "scrollWidth",
      "clientHeight",
      "clientWidth",
      "offsetHeight",
      "offsetWidth",
      "offsetTop",
      "offsetLeft"
    ] as const)
      expect(element[size], size).toBe(0);
  });

  it("is the same object for the same node, and null for no node", () => {
    const host = {};
    expect(elementFor(host)).toBe(elementFor(host));
    expect(elementFor(elementFor(host))).toBe(elementFor(host));
    expect(elementFor(null)).toBeNull();
    expect(elementFor(undefined)).toBeNull();
    expect(elementFor(7)).toBeNull();
  });

  it("gives a DOMRect-shaped rectangle", () => {
    const element = elementFor(node({ x: 10, y: 20, width: 30, height: 40 }))!;
    expect(element.getBoundingClientRect()).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      top: 20,
      left: 10,
      right: 40,
      bottom: 60
    });
  });

  it("gives a rectangle of zeros when the node cannot be measured", () => {
    expect(elementFor({})!.getBoundingClientRect()).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    });
  });

  it("forwards focus and blur to the node", () => {
    const host = { focus: vi.fn(), blur: vi.fn() };
    const element = elementFor(host)!;
    element.focus({ preventScroll: true });
    element.blur();
    expect(host.focus).toHaveBeenCalledOnce();
    expect(host.blur).toHaveBeenCalledOnce();
  });

  it("answers measureInWindow, which the kit's presenters use", () => {
    const native = vi.fn((callback) => callback(1, 2, 3, 4));
    const callback = vi.fn();
    elementFor({ measureInWindow: native })!.measureInWindow(callback);
    expect(callback).toHaveBeenCalledWith(1, 2, 3, 4);

    const fallback = vi.fn();
    elementFor(node({ x: 5, y: 6, width: 7, height: 8 }))!.measureInWindow(
      fallback
    );
    expect(fallback).toHaveBeenCalledWith(5, 6, 7, 8);
  });

  it("contains itself, its descendants as elements or nodes, and not null", () => {
    const child = {};
    const stranger = {};
    const parent = { contains: (other: unknown) => other === child };
    const element = elementFor(parent)!;
    expect(element.contains(element)).toBe(true);
    expect(element.contains(elementFor(child))).toBe(true);
    expect(element.contains(child)).toBe(true);
    expect(element.contains(elementFor(stranger))).toBe(false);
    expect(element.contains(null)).toBe(false);
  });

  it("reads sizes from the node", () => {
    const element = elementFor({
      scrollTop: 12,
      scrollHeight: 900,
      clientHeight: 300,
      offsetWidth: 120
    })!;
    expect(element.scrollTop).toBe(12);
    expect(element.scrollHeight).toBe(900);
    expect(element.clientHeight).toBe(300);
    expect(element.offsetWidth).toBe(120);
  });
});

describe("scrolling through a ref", () => {
  function scroller(extra: Partial<NativeNode> = {}) {
    return node(
      { x: 0, y: 100, width: 200, height: 300 },
      {
        tagName: "RN:ScrollView",
        scrollTop: 50,
        scrollLeft: 0,
        scrollHeight: 2000,
        clientHeight: 300,
        ...extra
      }
    );
  }

  it("scrolls a scroll view with scrollTo and by setting scrollTop", () => {
    const command = vi.fn();
    setScrollCommand(command);
    const host = scroller();
    const element = elementFor(host)!;
    element.scrollTo({ top: 400, behavior: "smooth" });
    expect(command).toHaveBeenLastCalledWith(host, 0, 400, true);
    element.scrollTop = 120;
    expect(command).toHaveBeenLastCalledWith(host, 0, 120, false);
  });

  it("keeps the offset inside the content", () => {
    const command = vi.fn();
    setScrollCommand(command);
    const host = scroller();
    elementFor(host)!.scrollTo({ top: 99999 });
    expect(command).toHaveBeenLastCalledWith(host, 0, 1700, false);
    elementFor(host)!.scrollTo({ top: -5 });
    expect(command).toHaveBeenLastCalledWith(host, 0, 0, false);
  });

  it("does nothing on an element that is not a scroll view", () => {
    const command = vi.fn();
    setScrollCommand(command);
    const element = elementFor(node({ x: 0, y: 0, width: 1, height: 1 }))!;
    element.scrollTo({ top: 10 });
    element.scrollTop = 10;
    expect(command).not.toHaveBeenCalled();
  });

  it("scrolls the nearest scroll view to bring an element into view", () => {
    const command = vi.fn();
    setScrollCommand(command);
    const host = scroller();
    const wrapper = { parentNode: host };
    const below = node(
      { x: 0, y: 700, width: 200, height: 40 },
      { parentNode: wrapper }
    );
    // 700 - 100 (viewport top) + 50 (already scrolled) = 650 from the content's top.
    elementFor(below)!.scrollIntoView();
    expect(command).toHaveBeenLastCalledWith(host, 0, 650, false);
    elementFor(below)!.scrollIntoView(false);
    expect(command).toHaveBeenLastCalledWith(host, 0, 390, false);
    elementFor(below)!.scrollIntoView({ block: "center", behavior: "smooth" });
    expect(command).toHaveBeenLastCalledWith(host, 0, 520, true);
    elementFor(below)!.scrollIntoView({ block: "nearest" });
    expect(command).toHaveBeenLastCalledWith(host, 0, 390, false);
  });

  it("leaves a visible element alone with block nearest, and survives no scroll view", () => {
    const command = vi.fn();
    setScrollCommand(command);
    const visible = node(
      { x: 0, y: 150, width: 200, height: 40 },
      { parentNode: scroller() }
    );
    elementFor(visible)!.scrollIntoView({ block: "nearest" });
    elementFor(node({ x: 0, y: 0, width: 1, height: 1 }))!.scrollIntoView();
    expect(command).not.toHaveBeenCalled();
  });
});

describe("a ref to a form control", () => {
  it("reads and writes value, checked and the selection through the control", () => {
    const control: ElementControl = {
      value: "hello",
      checked: false,
      setValue: vi.fn(),
      setChecked: vi.fn(),
      setSelection: vi.fn()
    };
    const element = elementFor({}, control)!;
    expect(element.value).toBe("hello");
    expect(element.checked).toBe(false);
    expect(element.selectionStart).toBe(5);
    expect(element.selectionEnd).toBe(5);

    element.value = "hi";
    expect(control.setValue).toHaveBeenCalledWith("hi");
    expect(element.value).toBe("hi");

    element.checked = true;
    expect(control.setChecked).toHaveBeenCalledWith(true);
    expect(element.checked).toBe(true);

    element.value = "hello";
    element.setSelectionRange(1, 3);
    expect(control.setSelection).toHaveBeenLastCalledWith(1, 3);
    expect([element.selectionStart, element.selectionEnd]).toEqual([1, 3]);
    element.select();
    expect(control.setSelection).toHaveBeenLastCalledWith(0, 5);
    element.setSelectionRange(9, 2);
    expect(control.setSelection).toHaveBeenLastCalledWith(5, 5);
  });

  it("gives the value as a number", () => {
    const element = elementFor({}, { value: "42.5" })!;
    expect(element.valueAsNumber).toBe(42.5);
    element.valueAsNumber = 7;
    expect(element.value).toBe("7");
    element.value = "";
    expect(element.valueAsNumber).toBeNaN();
  });

  it("has an empty value and no selection when it is not a control", () => {
    const element = new DesktopElement({});
    expect(element.value).toBe("");
    expect(element.checked).toBe(false);
    expect(element.selectionStart).toBeNull();
    expect(element.selectionEnd).toBeNull();
    expect(() => element.select()).not.toThrow();
  });

  it("is clicked by its label: the control's action, or focus without one", () => {
    const click = vi.fn();
    elementFor({}, { click })!.click();
    expect(click).toHaveBeenCalledOnce();
    const host = { focus: vi.fn() };
    elementFor(host)!.click();
    expect(host.focus).toHaveBeenCalledOnce();
  });
});

describe("elements by id", () => {
  it("finds a mounted element and forgets it when it unmounts", () => {
    const first = elementFor({})!;
    const second = elementFor({})!;
    const releaseFirst = registerElementId("field", first);
    expect(getElementById("field")).toBe(first);
    // A second element taking the id over is not removed by the first leaving.
    const releaseSecond = registerElementId("field", second);
    releaseFirst();
    expect(getElementById("field")).toBe(second);
    releaseSecond();
    expect(getElementById("field")).toBeNull();
  });
});
