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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// header.tsx is apps/web's file unchanged: its tag input is uncontrolled and
// cleared through the ref (`inputRef.current.value = ""`), and its menu opens
// below the input element. These run it on the desktop kit's real Input.

const native = vi.hoisted(() => ({ texts: [] as string[] }));

function reactNative() {
  const host = (name: string) =>
    forwardRef((props: any, ref: any) => {
      useImperativeHandle(ref, () => ({
        setNativeProps(next: { text?: string }) {
          if (next.text !== undefined) native.texts.push(next.text);
        },
        measure() {},
        measureInWindow(
          callback: (x: number, y: number, w: number, h: number) => void
        ) {
          callback(10, 20, 136, 30);
        },
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
}
vi.mock("react-native", () => reactNative());
vi.mock("../../../../../../packages/ui/node_modules/react-native", () =>
  reactNative()
);
vi.mock("react-native-reanimated", () => ({
  default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c }
}));
vi.mock(
  "../../../../../../packages/ui/node_modules/react-native-reanimated",
  () => ({
    default: { View: "AnimatedView", createAnimatedComponent: (c: any) => c }
  })
);
const svg = () => ({
  default: "Svg",
  Circle: "Circle",
  Path: "Path",
  SvgXml: "SvgXml"
});
vi.mock("react-native-svg", () => svg());
vi.mock("../../../../../../packages/ui/node_modules/react-native-svg", () =>
  svg()
);
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

const menu = vi.hoisted(() => ({
  isOpen: false,
  openMenu: vi.fn(),
  closeMenu: vi.fn()
}));
vi.mock("../../hooks/use-menu", () => ({
  useMenuTrigger: () => menu
}));
vi.mock("../../stores/editor-store", () => ({ useEditorStore: () => null }));
vi.mock("../../stores/tag-store", () => ({ useStore: {} }));
vi.mock("../../stores/note-store", () => ({ useStore: {} }));
vi.mock("../../stores/app-store", () => ({ useStore: {} }));
vi.mock("../../common/db", () => ({ db: {} }));
vi.mock("../../common", () => ({ checkFeature: vi.fn() }));
vi.mock("../../navigation", () => ({ navigate: vi.fn() }));
vi.mock("../icon-tag", () => ({ default: () => null }));
vi.mock("../icons", () => ({
  Tag: Object.assign(() => null, { path: "<svg/>" }),
  Plus: Object.assign(() => null, { path: "<svg/>" })
}));
vi.mock("@notesnook/intl", () => ({
  strings: { addATag: () => "Add a tag" }
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
// The unit config compiles JSX with the classic runtime.
(globalThis as any).React = await import("react");

const { Autosuggest } = await import("./header");

type Item = { title: string };
const defaults: Item[] = [{ title: "home" }, { title: "work" }];
const filter = vi.fn(async (query: string) =>
  defaults.filter((item) => item.title.includes(query))
);
const onAdd = vi.fn();
const onRemove = vi.fn();
const toMenuItems = vi.fn(
  (filtered: Item[], _reset?: () => void, _query?: string) =>
    filtered.map((item) => ({
      type: "button" as const,
      key: item.title,
      title: item.title
    }))
);

let view: Rendered;
const input = () => view.get((n) => n.type === "TextInput");
const flush = () => act(async () => {});
const type = async (text: string) => {
  await act(async () => input().props.onChange({ nativeEvent: { text } }));
  await flush();
};
const key = async (name: string) => {
  await act(async () =>
    input().props.onKeyDown({ nativeEvent: { key: name } })
  );
  await flush();
};

const element = () =>
  h(Autosuggest<Item>, {
    sessionId: "session",
    filter,
    onAdd,
    onRemove,
    toMenuItems,
    defaultItems: async () => defaults
  });
// The menu store re-renders its users when the menu opens.
const openMenu = async () => {
  menu.isOpen = true;
  await view.update(element());
};

beforeEach(async () => {
  native.texts = [];
  menu.isOpen = false;
  vi.clearAllMocks();
  view = await mount(element());
});
afterEach(cleanup);

describe("the tag input (apps/web's Autosuggest on the desktop kit)", () => {
  it("opens the recent tags below the input when focused while empty", async () => {
    await act(async () => input().props.onFocus({ nativeEvent: {} }));
    await flush();
    expect(menu.openMenu).toHaveBeenCalledTimes(1);
    const [items, options] = menu.openMenu.mock.calls[0];
    expect(items.map((item: { key: string }) => item.key)).toEqual([
      "home",
      "work"
    ]);
    expect(options.position).toMatchObject({
      location: "below",
      isTargetAbsolute: true
    });
    // The input element itself, which use-menu measures.
    expect(typeof options.position.target.getBoundingClientRect).toBe(
      "function"
    );
    expect(options.position.target.value).toBe("");
  });

  it("filters while typing and passes the typed text on", async () => {
    await type("wo");
    expect(filter).toHaveBeenCalledWith("wo");
    expect(toMenuItems.mock.calls.at(-1)?.[0]).toEqual([{ title: "work" }]);
    expect(toMenuItems.mock.calls.at(-1)?.[2]).toBe("wo");
  });

  it("Enter with the menu open adds the trimmed text and clears the field", async () => {
    await type(" work ");
    await openMenu();
    await key("Enter");
    expect(onAdd).toHaveBeenCalledWith("work");
    expect(native.texts.at(-1)).toBe("");
    expect(menu.closeMenu).toHaveBeenCalled();
  });

  it("Enter after moving through the menu with the arrows adds nothing", async () => {
    await type("wo");
    await openMenu();
    await key("ArrowDown");
    await key("Enter");
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("Backspace in the empty field removes the last tag", async () => {
    await key("Backspace");
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
