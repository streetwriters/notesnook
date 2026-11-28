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

/**
 * The DOM bridge's `<input>`: a colour input draws the kit's colour picker and
 * reads and writes its value as web's `<input type="color">` does.
 */
import {
  createElement as h,
  createRef,
  forwardRef,
  useImperativeHandle
} from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => {
  const host = (name: string) =>
    forwardRef((props: any, ref: any) => {
      useImperativeHandle(ref, () => ({
        setNativeProps() {},
        measure() {},
        measureInWindow() {},
        focus() {},
        blur() {}
      }));
      return h(name, props);
    });
  return {
    View: host("View"),
    Text: host("Text"),
    TextInput: host("TextInput"),
    Pressable: host("Pressable"),
    ScrollView: host("ScrollView"),
    Image: host("Image"),
    Dimensions: {
      get: () => ({ width: 1200, height: 800 }),
      addEventListener: () => ({ remove() {} })
    },
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => s },
    Platform: { OS: "macos", select: (o: any) => o.macos ?? o.default },
    codegenNativeCommands: () => ({}),
    TurboModuleRegistry: { get: () => null, getEnforcing: () => ({}) },
    NativeModules: {}
  };
});
vi.mock("react-native-reanimated", () => ({
  default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c }
}));
vi.mock("react-native-svg", () => ({
  default: "Svg",
  Circle: "Circle",
  Path: "Path",
  SvgXml: "SvgXml"
}));
vi.mock("@platform", () => ({ shell: { openExternal: vi.fn() } }));
vi.mock("@react-native-gpui/core/desktop", () => ({ DragDrop: {} }));
vi.mock("@react-native-gpui/fs", () => ({}));
vi.mock("../shared/icons", () => ({ CaretDown: () => null }));
// The picker is a native wheel; the test draws it as a host element that
// keeps the props the kit gives it.
vi.mock("./color-picker", async () => {
  const { createElement, forwardRef } = await import("react");
  return {
    ColorPicker: forwardRef((props: any, ref: any) =>
      createElement("ColorPicker", { ...props, ref })
    )
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { Dom } = await import("./dom");

let root: ReactTestRenderer;
function render(element: any) {
  act(() => {
    root = create(element, { createNodeMock: () => ({}) });
  });
  return root;
}

beforeEach(() => {
  act(() => root?.unmount());
});

describe("<input type=\"color\">", () => {
  it("draws the kit's colour picker with the input's value, not a text field", () => {
    render(h(Dom.input as any, { type: "color", defaultValue: "#112233" }));
    expect(root.root.findAllByType("TextInput" as any)).toHaveLength(0);
    expect(root.root.findByType("ColorPicker" as any).props.value).toBe(
      "#112233"
    );
  });

  it("reports a picked colour as a change event carrying the hex value", () => {
    const onChange = vi.fn();
    render(
      h(Dom.input as any, {
        type: "color",
        defaultValue: "#112233",
        onChange
      })
    );
    act(() =>
      root.root.findByType("ColorPicker" as any).props.onChange("#445566")
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("#445566");
    expect(root.root.findByType("ColorPicker" as any).props.value).toBe(
      "#445566"
    );
  });

  it("redraws the picker when a value is written to its ref", () => {
    const ref = createRef<any>();
    render(
      h(Dom.input as any, { type: "color", defaultValue: "#112233", ref })
    );
    expect(ref.current.value).toBe("#112233");
    act(() => {
      ref.current.value = "#778899";
    });
    expect(ref.current.value).toBe("#778899");
    expect(root.root.findByType("ColorPicker" as any).props.value).toBe(
      "#778899"
    );
  });

  it("leaves a text input a text field", () => {
    render(h(Dom.input as any, { type: "text", defaultValue: "hello" }));
    expect(root.root.findAllByType("ColorPicker" as any)).toHaveLength(0);
    expect(root.root.findByType("TextInput" as any).props.defaultValue).toBe(
      "hello"
    );
  });
});
