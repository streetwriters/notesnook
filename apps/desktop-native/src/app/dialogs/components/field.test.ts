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

/* eslint-disable react/display-name, no-restricted-globals -- test-only stand-ins and globals */
import { createElement as h, forwardRef, useImperativeHandle } from "react";
import { act } from "react";
import {
  cleanup,
  render as mount,
  type Rendered
} from "../../../../../../packages/ui/src/kit/desktop/testing/render";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    ScrollView: host("ScrollView"),
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
vi.mock("../../../../../../packages/ui/node_modules/react-native", () => {
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
    ScrollView: host("ScrollView"),
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
vi.mock(
  "../../../../../../packages/ui/node_modules/react-native-reanimated",
  () => ({
    default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c }
  })
);
vi.mock("react-native-svg", () => ({
  default: "Svg",
  Circle: "Circle",
  Path: "Path",
  SvgXml: "SvgXml"
}));
vi.mock("../../../../../../packages/ui/node_modules/react-native-svg", () => ({
  default: "Svg",
  Circle: "Circle",
  Path: "Path",
  SvgXml: "SvgXml"
}));
vi.mock("@platform", () => ({ shell: { openExternal: vi.fn() } }));
vi.mock("@react-native-gpui/core/desktop", () => ({ DragDrop: {} }));
vi.mock(
  "../../../../../../packages/ui/node_modules/@react-native-gpui/core/desktop",
  () => ({ DragDrop: {} })
);
vi.mock("@react-native-gpui/fs", () => ({}));
vi.mock(
  "../../../../../../packages/ui/node_modules/@react-native-gpui/fs",
  () => ({})
);
vi.mock("../../../../../../packages/ui/src/kit/shared/icons", () => ({
  CaretDown: () => null
}));

// The kit and its test renderer use packages/ui's React; the app code under
// test must use that same copy.
vi.mock(
  "react",
  async () =>
    // @ts-expect-error packages/ui ships no types for its React copy
    await import("../../../../../../packages/ui/node_modules/react")
);
vi.mock(
  "react/jsx-runtime",
  async () =>
    // @ts-expect-error packages/ui ships no types for its React copy
    await import("../../../../../../packages/ui/node_modules/react/jsx-runtime")
);
vi.mock(
  "react/jsx-dev-runtime",
  async () =>
    await import(
      // @ts-expect-error packages/ui ships no types for its React copy
      "../../../../../../packages/ui/node_modules/react/jsx-dev-runtime"
    )
);
vi.mock("@notesnook/ui-kit", async () => ({
  ...(await import("../../../../../../packages/ui/src/kit/desktop/primitives"))
}));
vi.mock("../../components/icons", () => ({
  PasswordVisible: () => null,
  PasswordInvisible: () => null,
  Error: () => null,
  Warning: () => null
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
// The unit config compiles JSX with the classic runtime.
(globalThis as any).React = await import("react");

const { Box } = await import(
  "../../../../../../packages/ui/src/kit/desktop/primitives"
);
const { Field } = await import("./field");

let view: Rendered;
async function render(element: any) {
  view = await mount(element);
}
const inputs = () => view.all((n) => n.type === "TextInput");
const type = (index: number, text: string) =>
  act(() => inputs()[index].props.onChange({ nativeEvent: { text } }));
const enter = (index: number) =>
  act(() =>
    inputs()[index].props.onSubmitEditing({ nativeEvent: { text: "" } })
  );

afterEach(cleanup);

// The dialogs moved from Field's onSubmitEditing to a form around the field
// (prompt, item, add-notebook, create-color, backup-password, password, issue,
// email-change, mfa, inbox-api-keys): Enter in the field must still submit,
// and a field outside the form must not.
describe("Field in a dialog form", () => {
  it("Enter submits the form around it, with the typed value", async () => {
    const values: string[] = [];
    const onSubmit = vi.fn((e: any) => e.preventDefault());
    await render(
      h(
        Box,
        { as: "form", onSubmit },
        h(Field, { onChange: (e: any) => values.push(e.target.value) })
      )
    );
    type(0, "My notebook");
    enter(0);
    expect(values).toEqual(["My notebook"]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("a field outside the form does not submit it", async () => {
    const onSubmit = vi.fn();
    await render(
      h(Box, {}, h(Box, { as: "form", onSubmit }, h(Field, {})), h(Field, {}))
    );
    // Outside a form, Enter has nothing to do: no submit handler at all.
    expect(inputs()[1].props.onSubmitEditing).toBeUndefined();
    expect(onSubmit).not.toHaveBeenCalled();
    enter(0);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("two fields in their own forms submit once each (create colour)", async () => {
    const onSubmit = vi.fn();
    await render(
      h(
        Box,
        {},
        h(Box, { as: "form", onSubmit }, h(Field, {})),
        h(Box, { as: "form", onSubmit }, h(Field, {}))
      )
    );
    enter(0);
    enter(1);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("a multiline field does not submit on Enter (issue body)", async () => {
    const onSubmit = vi.fn();
    await render(
      h(Box, { as: "form", onSubmit }, h(Field, { as: "textarea" }))
    );
    const textarea = inputs()[0];
    if (textarea.props.onSubmitEditing)
      act(() => textarea.props.onSubmitEditing({ nativeEvent: { text: "" } }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validate blocks onChange for invalid text", async () => {
    const values: string[] = [];
    await render(
      h(Field, {
        validate: (t: string) => t.length > 2,
        onChange: (e: any) => values.push(e.target.value)
      })
    );
    type(0, "ab");
    type(0, "abc");
    expect(values).toEqual(["abc"]);
  });
});
