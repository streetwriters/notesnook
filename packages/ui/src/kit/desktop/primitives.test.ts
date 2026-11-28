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
 * the web-shaped names fire and the removed React Native ones do not.
 */
import {
  createElement as h,
  forwardRef,
  Fragment,
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
        focus() {
          (globalThis as any).focusCalls =
            ((globalThis as any).focusCalls ?? 0) + 1;
        },
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
const presented = vi.hoisted(() => ({ props: undefined as any }));
vi.mock("./menu", () => ({
  MenuPresenter: (props: any) => {
    presented.props = props;
    return null;
  }
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const {
  Checkbox,
  Input,
  Slider,
  Switch,
  Box,
  Button,
  Flex,
  Text,
  Textarea,
  FormData,
  resolvePercentTranslate
} = await import("./primitives");
const { createButtonVariant } = await import("./hooks");
const { Select } = await import("./select");
const { DomRoot, ReactDOM, HTMLElement } = await import("./react-dom");
const { document } = await import("./dom");

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
  it("raises onChange with the native text, and not the removed onChangeText", () => {
    const onChangeText = vi.fn();
    const onChange = vi.fn();
    render(h(Input, { onChangeText, onChange } as never));
    fire(() =>
      root.root
        .findByType("TextInput" as any)
        .props.onChange({ nativeEvent: { text: "hello" } })
    );
    expect(onChangeText).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe("hello");
  });

  it("raises onPaste with the pasted text as clipboard data", () => {
    const onPaste = vi.fn();
    const preventDefault = vi.fn();
    render(h(Input, { onPaste } as never));
    fire(() =>
      root.root
        .findByType("TextInput" as any)
        .props.onPaste({ nativeEvent: { text: "123456" }, preventDefault })
    );
    expect(onPaste).toHaveBeenCalledTimes(1);
    const event = onPaste.mock.calls[0][0];
    expect(event.clipboardData.getData("text")).toBe("123456");
    expect(event.clipboardData.getData("text/plain")).toBe("123456");
    expect(event.clipboardData.types).toEqual(["text/plain"]);
    expect(event.clipboardData.files).toHaveLength(0);
    expect(typeof event.currentTarget.focus).toBe("function");
    event.preventDefault();
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("raises a Textarea's onPaste too, and an empty clipboard has no text", () => {
    const onPaste = vi.fn();
    render(h(Textarea, { onPaste } as never));
    fire(() =>
      root.root.findByType("TextInput" as any).props.onPaste({ nativeEvent: {} })
    );
    expect(onPaste.mock.calls[0][0].clipboardData.getData("text")).toBe("");
    expect(onPaste.mock.calls[0][0].clipboardData.types).toEqual([]);
  });

  it("leaves the native paste handler unset without onPaste", () => {
    render(h(Input, {} as never));
    expect(
      root.root.findByType("TextInput" as any).props.onPaste
    ).toBeUndefined();
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
  it("raise onChange with the new checked state, controlled", () => {
    const onChange = vi.fn((e: any) => e.target.checked);
    render(h(Checkbox, { checked: false, onChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.results[0].value).toBe(true);
  });

  it("controlled checked stays as given without a change", () => {
    const onChange = vi.fn();
    render(h(Switch, { checked: true, onChange }));
    fire(() => pressable().props.onPress(press()));
    fire(() => pressable().props.onPress(press()));
    // still controlled at true, so each press asks for false
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0].target.checked).toBe(false);
  });

  it("uncontrolled starts at defaultChecked and toggles", () => {
    const onChange = vi.fn();
    render(h(Checkbox, { defaultChecked: true, onChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onChange.mock.calls[0][0].target.checked).toBe(false);
    fire(() => pressable().props.onPress(press()));
    expect(onChange.mock.calls[1][0].target.checked).toBe(true);
  });

  it("without checked or defaultChecked starts unchecked", () => {
    const onChange = vi.fn();
    render(h(Checkbox, { onChange }));
    fire(() => pressable().props.onPress(press()));
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });
});

describe("Button", () => {
  it("raises onClick, and not the removed onPress", () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    render(h(Button, { onPress, onClick } as never, "Go"));
    fire(() => pressable().props.onPress(press()));
    expect(onPress).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(typeof onClick.mock.calls[0][0].stopPropagation).toBe("function");
  });
});

describe("resolvePercentTranslate", () => {
  it("turns a translate of the element's own size into pixels", () => {
    expect(resolvePercentTranslate("translateY(-50%)", 20, 10)).toBe(
      "translateY(-5px)"
    );
    expect(
      resolvePercentTranslate("translateX(50%) rotate(4deg)", 20, 10)
    ).toBe("translateX(10px) rotate(4deg)");
    expect(resolvePercentTranslate("translate(-50%)", 20, 10)).toBe(
      "translate(-10px, -5px)"
    );
  });

  it("leaves other transforms alone", () => {
    const array = [{ rotate: "90deg" }];
    expect(resolvePercentTranslate(array, 20, 10)).toBe(array);
    expect(resolvePercentTranslate("translateY(4px)", 20, 10)).toBe(
      "translateY(4px)"
    );
  });
});

describe("Text", () => {
  it("draws <br /> as a line break, in fragments too", () => {
    const tree = render(
      h(
        Text,
        {},
        "a",
        h("br", { key: "1" }),
        h(Fragment, { key: "f" }, "b", h("br"), "c")
      )
    );
    const text = tree.root.findAll((node) => (node.type as any) === "Text")[0];
    expect(text.props.children).toEqual(["a", "\n", "b", "\n", "c"]);
  });

  it("is selectable when written with the web selectable class", () => {
    const tree = render(h(Text, { className: "selectable" }, "Failed"));
    const text = tree.root.findAll((node) => (node.type as any) === "Text")[0];
    expect(text.props.selectable).toBe(true);
  });

  it("is not selectable for another class, and an explicit selectable wins", () => {
    const other = render(h(Text, { className: "selectable-off" }, "x"));
    const otherText = other.root.findAll(
      (node) => (node.type as any) === "Text"
    )[0];
    expect(otherText.props.selectable).toBeUndefined();

    const explicit = render(
      h(Text, { className: "selectable", selectable: false }, "x")
    );
    const explicitText = explicit.root.findAll(
      (node) => (node.type as any) === "Text"
    )[0];
    expect(explicitText.props.selectable).toBe(false);
  });
});

describe("Box and Flex", () => {
  it("draw text written straight into them as text, as HTML does", () => {
    const tree = render(h(Box, {}, "Hello ", 3, h(Box, { key: "b" })));
    const texts = tree.root.findAll((node) => (node.type as any) === "Text");
    expect(texts.map((node) => node.props.children)).toEqual(["Hello ", 3]);
  });

  it("leave element children as they are", () => {
    const tree = render(h(Box, {}, h(Box, { key: "a" })));
    expect(
      tree.root.findAll((node) => (node.type as any) === "Text")
    ).toHaveLength(0);
  });
});

describe("Slider", () => {
  it("is a host element the primitives render", () => {
    render(h(Slider, { value: 5 }));
    expect(root.toJSON()).not.toBeNull();
  });
});

describe("Select", () => {
  function title() {
    return JSON.stringify(root.toJSON());
  }
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
      h(
        Select,
        { value: "b" },
        h("option", { value: "a" }, "Alpha"),
        h("option", { value: "b" }, "Beta")
      )
    );
    expect(title()).toContain("Beta");
  });
});

describe("Select menu", () => {
  it("opens its own menu below itself and raises onChange for a new option", () => {
    const onChange = vi.fn();
    presented.props = undefined;
    render(
      h(
        Select,
        { defaultValue: "a", onChange },
        h("option", { value: "a" }, "Alpha"),
        h("option", { value: "b" }, "Beta")
      )
    );
    expect(presented.props).toBeUndefined();
    fire(() => pressable().props.onPress(press()));
    expect(presented.props.position.location).toBe("below");
    expect(
      presented.props.items.map((item: any) => [item.title, item.isChecked])
    ).toEqual([
      ["Alpha", true],
      ["Beta", false]
    ]);
    fire(() => presented.props.items[1].onClick());
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target.value).toBe("b");
    fire(() => presented.props.onClose());
    expect(JSON.stringify(root.toJSON())).toContain("Beta");
  });
});

describe("element.click()", () => {
  it("runs the element's onClick", () => {
    const onClick = vi.fn();
    let element: any;
    render(
      h(Flex, {
        onClick,
        ref: (node: any) => {
          element = node ?? element;
        }
      })
    );
    fire(() => element.click());
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ReactDOM.render into a DomRoot", () => {
  it("draws what is rendered into the element with its id, until it is unmounted", () => {
    render(h(DomRoot, { id: "dialogContainer" }));
    const container = document.getElementById("dialogContainer");
    expect(container instanceof HTMLElement).toBe(true);
    expect(JSON.stringify(root.toJSON())).not.toContain("Preview");
    fire(() => ReactDOM.render(h(Text, {}, "Preview"), container));
    expect(JSON.stringify(root.toJSON())).toContain("Preview");
    fire(() => {
      expect(ReactDOM.unmountComponentAtNode(container)).toBe(true);
    });
    expect(JSON.stringify(root.toJSON())).not.toContain("Preview");
    expect(ReactDOM.unmountComponentAtNode(container)).toBe(false);
  });
});

describe("createButtonVariant", () => {
  it("draws web's button look with the hover and pressed states desktop has", () => {
    render(
      h(Flex, {
        onClick: () => {},
        sx: {
          ...createButtonVariant("transparent", "transparent", {
            hover: { bg: "hover-selected" }
          }),
          borderRadius: "5px"
        }
      })
    );
    const node = pressable();
    expect(node.props.style.borderRadius).toBe(5);
    expect(node.props.style.flexDirection).toBe("row");
    expect(node.props.style.backgroundColor).toBe("transparent");
    expect(node.props.hoverStyle?.backgroundColor).toMatch(/^#/);
  });
});

describe("Button", () => {
  it("submits the form its form attribute names, from outside it", () => {
    const onSubmit = vi.fn();
    render(
      h(
        Box,
        {},
        h(Box, { as: "form", id: "2faForm", onSubmit }),
        h(Button, { form: "2faForm" }, "Next")
      )
    );
    fire(() => root.root.findByType("Pressable" as any).props.onPress(press()));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a form that is not mounted", () => {
    render(h(Button, { form: "missing" }, "Next"));
    expect(() =>
      fire(() =>
        root.root.findByType("Pressable" as any).props.onPress(press())
      )
    ).not.toThrow();
  });

  it("focuses itself on mount with autoFocus, and not without it", () => {
    (globalThis as any).focusCalls = 0;
    render(h(Button, {}, "Plain"));
    expect((globalThis as any).focusCalls).toBe(0);
    render(h(Button, { autoFocus: true }, "Focused"));
    expect((globalThis as any).focusCalls).toBe(1);
  });
});

describe("viewport units", () => {
  it("draws vw and vh as a share of the window", () => {
    render(h(Box, { sx: { width: "50vw", maxHeight: "25vh", height: 10 } }));
    expect(root.root.findByType("View" as any).props.style).toMatchObject({
      width: 600,
      maxHeight: 200,
      height: 10
    });
  });
});

describe("FormData", () => {
  it("holds the named fields of the submitted form, as the DOM's does", () => {
    let data: InstanceType<typeof FormData> | undefined;
    render(
      h(
        Box,
        {
          as: "form",
          onSubmit: (e: any) => {
            data = new FormData(e.target);
          }
        },
        h(Input, { name: "title", defaultValue: "Hello" }),
        h(Input, { placeholder: "unnamed" }),
        h(Checkbox, { name: "pinned", defaultChecked: true }),
        h(Checkbox, { name: "locked" }),
        h(Button, {}, "Save")
      )
    );
    const [title] = root.root.findAllByType("TextInput" as any);
    fire(() => title.props.onChange({ nativeEvent: { text: "Renamed" } }));
    fire(() =>
      root.root
        .findAll(
          (n: any) =>
            n.type === "Pressable" && n.props.accessibilityRole === "button"
        )[0]
        .props.onPress(press())
    );
    expect(data).toBeDefined();
    expect(Object.fromEntries(data!.entries())).toEqual({
      title: "Renamed",
      pinned: "on"
    });
    expect(data!.has("locked")).toBe(false);
    expect(data!.get("missing")).toBeNull();
  });

  it("is empty for something that is not a submitted form", () => {
    expect([...new FormData({}).keys()]).toEqual([]);
    expect([...new FormData().keys()]).toEqual([]);
  });
});

describe("nested input styles", () => {
  it("draws sx.input on the text fields inside, over their own styles", () => {
    render(
      h(Box, { sx: { input: { px: 7 } } }, h(Input, { sx: { px: 1, py: 3 } }))
    );
    expect(root.root.findByType("TextInput" as any).props.style).toMatchObject({
      paddingLeft: 35,
      paddingTop: 15
    });
  });
});

describe("raw HTML elements and nested selectors", () => {
  it("a rule in a parent's sx styles the elements it names below it", async () => {
    const { Dom } = await import("./dom");
    render(
      h(
        Flex,
        { sx: { "& strong": { color: "#ff0000" }, ".quiet": { opacity: 0.5 } } },
        h(
          Text,
          { "data-test-id": "line" },
          "Most notes in ",
          h(Dom.strong, { "data-test-id": "month" }, "March"),
          h(Dom.span, { "data-test-id": "plain", className: "quiet" }, "!")
        ),
        h(Text, { "data-test-id": "other" }, "untouched")
      )
    );
    const style = (id: string) =>
      root.root.findAll(
        (node) =>
          typeof node.type === "string" &&
          (node.props.testID === id || node.props["data-test-id"] === id)
      )[0].props.style;
    expect(style("month").color).toBe("#ff0000");
    // <strong> is bold on its own.
    expect(Number(style("month").fontWeight)).toBeGreaterThanOrEqual(600);
    expect(style("plain").fontWeight).not.toBe(style("month").fontWeight);
    expect(style("plain")).toMatchObject({ opacity: 0.5 });
    expect(style("plain").color).not.toBe("#ff0000");
    expect(style("other").color).not.toBe("#ff0000");
    expect(style("other").opacity).toBeUndefined();
  });

  it("overflow scroll scrolls, with the box's layout on its content; auto does not", () => {
    render(
      h(
        Box,
        null,
        h(Flex, {
          "data-test-id": "scroller",
          sx: {
            position: "fixed",
            overflowY: "scroll",
            overflowX: "hidden",
            flexDirection: "column",
            gap: 10,
            width: 300
          }
        }),
        h(Flex, { "data-test-id": "clipped", sx: { overflowY: "auto" } })
      )
    );
    const scrollers = root.root.findAll(
      (node) => (node.type as unknown) === "ScrollView"
    );
    expect(scrollers).toHaveLength(1);
    const { style, contentContainerStyle, horizontal } = scrollers[0].props;
    expect(horizontal).toBe(false);
    expect(style).toMatchObject({ position: "absolute", width: 300 });
    expect(style).not.toHaveProperty("gap");
    expect(contentContainerStyle).toMatchObject({
      flexGrow: 1,
      flexDirection: "column",
      gap: 10
    });
  });

  it("a <style> element registers its keyframes and draws nothing", async () => {
    const { Dom } = await import("./dom");
    const { getKeyframes } = await import("../shared/style/css-motion");
    render(
      h(
        Box,
        null,
        h(
          Dom.style,
          null,
          "@keyframes domTestFade { from { opacity: 0; } to { opacity: 1; } }"
        ),
        h(Box, {
          "data-test-id": "animated",
          sx: { animation: "domTestFade 1s ease-out both" }
        })
      )
    );
    expect(getKeyframes("domTestFade")).toEqual({
      from: { opacity: 0 },
      to: { opacity: 1 }
    });
    const animated = root.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        (node.props.testID === "animated" ||
          node.props["data-test-id"] === "animated")
    )[0];
    expect(animated.props.style).toMatchObject({
      animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
      animationFillMode: "both"
    });
  });

  it("an svg draws a registered symbol and nothing for an unknown one", async () => {
    const { Dom, registerSvgSymbol } = await import("./dom");
    registerSvgSymbol("dom-test-logo", "<svg viewBox='0 0 1 1'></svg>");
    render(
      h(
        Box,
        null,
        h(Dom.svg, { style: { width: 20, height: 20 } }, h("use", { href: "#dom-test-logo" })),
        h(Dom.svg, null, h("use", { href: "#not-registered" }))
      )
    );
    const drawn = root.root.findAll(
      (node) => typeof node.type === "string" && node.props.xml !== undefined
    );
    expect(drawn).toHaveLength(1);
    expect(drawn[0].props).toMatchObject({ width: 20, height: 20 });
  });
});
