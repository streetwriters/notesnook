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
 * Renders the desktop primitives with react-native swapped for plain host
 * elements, and drives the native callbacks they hand down, to check that
 * the deprecated names and the new web-shaped ones both still fire.
 */
import { createElement as h, forwardRef, useImperativeHandle } from "react";
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

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const { Checkbox, Input, Slider, Switch, Box, Button } = await import(
  "./primitives"
);
const { Select } = await import("./select");

let root: ReactTestRenderer;
function render(element: any) {
  act(() => {
    root = create(element);
  });
  return root;
}
function press() {
  return { nativeEvent: {}, stopPropagation() {}, preventDefault() {} };
}
function fire(fn: () => void) {
  act(fn);
}

beforeEach(() => {
  act(() => root?.unmount());
});

describe("Input", () => {
  it("still raises onChangeText with the native text, and onChange", () => {
    const onChangeText = vi.fn();
    const onChange = vi.fn();
    render(h(Input, { onChangeText, onChange }));
    fire(() =>
      root.root
        .findByType("TextInput" as any)
        .props.onChange({ nativeEvent: { text: "hello" } })
    );
    expect(onChangeText).toHaveBeenCalledWith("hello");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("hello");
  });

  it("still raises onSubmitEditing with the text", () => {
    const onSubmitEditing = vi.fn();
    render(h(Input, { onSubmitEditing }));
    fire(() =>
      root.root
        .findByType("TextInput" as any)
        .props.onSubmitEditing({ nativeEvent: { text: "done" } })
    );
    expect(onSubmitEditing).toHaveBeenCalledWith("done");
  });

  it("submits the enclosing form on Enter", () => {
    const onSubmit = vi.fn();
    render(h(Box, { as: "form", onSubmit }, h(Input, {})));
    fire(() =>
      root.root
        .findByType("TextInput" as any)
        .props.onSubmitEditing({ nativeEvent: { text: "" } })
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(typeof onSubmit.mock.calls[0][0].preventDefault).toBe("function");
  });
});

function pressable() {
  return root.root.find(
    (node: any) =>
      typeof node.type === "string" && typeof node.props.onPress === "function"
  );
}

describe("Checkbox and Switch", () => {
  it("raise onCheckedChange then onChange, controlled", () => {
    const calls: string[] = [];
    render(
      h(Checkbox, {
        checked: false,
        onCheckedChange: (v: boolean) => calls.push(`checked:${v}`),
        onChange: (e: any) => calls.push(`change:${e.target.checked}`)
      })
    );
    fire(() => pressable().props.onPress(press()));
    expect(calls).toEqual(["checked:true", "change:true"]);
  });

  it("controlled checked stays as given without a change", () => {
    const onCheckedChange = vi.fn();
    render(h(Switch, { checked: true, onCheckedChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    fire(() => pressable().props.onPress(press()));
    // still controlled at true, so the next press asks for false again
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("uncontrolled starts at defaultChecked and toggles", () => {
    const onCheckedChange = vi.fn();
    render(h(Checkbox, { defaultChecked: true, onCheckedChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    fire(() => pressable().props.onPress(press()));
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it("without checked or defaultChecked starts unchecked, as before", () => {
    const onCheckedChange = vi.fn();
    render(h(Checkbox, { onCheckedChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("Button", () => {
  it("raises both onPress and onClick", () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    render(h(Button, { onPress, onClick }, "Go"));
    fire(() => pressable().props.onPress(press()));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(typeof onClick.mock.calls[0][0].stopPropagation).toBe("function");
  });
});

describe("Slider", () => {
  it("is a host element the primitives render", () => {
    render(h(Slider, { value: 5, onValueChange: vi.fn() }));
    expect(root.toJSON()).not.toBeNull();
  });
});

describe("Select", () => {
  function title() {
    return JSON.stringify(root.toJSON());
  }
  it("with the deprecated options prop and no value shows no choice", () => {
    render(
      h(Select, {
        options: [
          { value: "a", title: "Alpha" },
          { value: "b", title: "Beta" }
        ]
      })
    );
    expect(title()).not.toContain("Alpha");
  });

  it("with option children and no value shows the first, like HTML", () => {
    render(
      h(
        Select,
        {},
        h("option", { value: "a" }, "Alpha"),
        h("option", { value: "b" }, "Beta")
      )
    );
    expect(title()).toContain("Alpha");
  });

  it("shows the controlled value", () => {
    render(
      h(Select, {
        value: "b",
        options: [
          { value: "a", title: "Alpha" },
          { value: "b", title: "Beta" }
        ]
      })
    );
    expect(title()).toContain("Beta");
  });
});

