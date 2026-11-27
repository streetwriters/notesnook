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

import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { legacy, type LegacyOptions } from "./legacy";

type Props = Record<string, any>;

/** Renders `legacy(Probe)` once and returns the props `Probe` received. */
function passed(props: Props, options?: LegacyOptions): Props {
  let received: Props = {};
  const Probe = (inner: Props) => {
    received = inner;
    return null;
  };
  const Component = legacy<ComponentType<Props>>(Probe, options);
  renderToStaticMarkup(createElement(Component, props));
  return received;
}

function mouseEvent(extra: Props = {}) {
  return {
    button: 0,
    detail: 1,
    clientX: 30,
    clientY: 50,
    pageX: 30,
    pageY: 50,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: true,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 10, top: 20 })
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extra
  };
}

describe("legacy", () => {
  it("passes new-style props through untouched", () => {
    const onClick = () => {};
    const sx = { bg: "background" };
    const out = passed({
      "data-test-id": "save",
      onClick,
      sx,
      title: "Save",
      children: "x"
    });
    expect(out.onClick).toBe(onClick);
    expect(out.sx).toBe(sx);
    expect(out["data-test-id"]).toBe("save");
    expect(out.title).toBe("Save");
    expect(out.children).toBe("x");
    expect(out.className).toBeUndefined();
    expect(Object.keys(out).sort()).toEqual(
      ["children", "data-test-id", "onClick", "ref", "sx", "title"].sort()
    );
  });

  it("renames testID and never forwards a deprecated name", () => {
    const out = passed({
      testID: "old",
      onPress: () => {},
      onHoverIn: () => {},
      onHoverOut: () => {},
      numberOfLines: 2,
      resizeMode: "contain",
      selectable: true,
      onChangeText: () => {},
      onSubmitEditing: () => {},
      selectTextOnFocus: true,
      droppable: true,
      acceptsFiles: [".txt"],
      onDropFiles: () => {},
      group: "row"
    });
    expect(out["data-test-id"]).toBe("old");
    for (const name of [
      "testID",
      "onPress",
      "onHoverIn",
      "onHoverOut",
      "numberOfLines",
      "resizeMode",
      "selectable",
      "onChangeText",
      "onSubmitEditing",
      "selectTextOnFocus",
      "droppable",
      "acceptsFiles",
      "onDropFiles",
      "group"
    ])
      expect(out).not.toHaveProperty(name);
    expect(out.className).toBe("nn-group-row");
    expect(out.sx).toMatchObject({
      WebkitLineClamp: 2,
      objectFit: "contain",
      userSelect: "text"
    });
    expect(passed({ testID: "old", "data-test-id": "new" })["data-test-id"]).toBe(
      "new"
    );
  });

  it("delivers onPress the old press event from a click", () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    const out = passed({ onPress, onClick });
    const event = mouseEvent({ button: 2 });
    out.onClick(event);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(onPress).toHaveBeenCalledTimes(1);
    const press = onPress.mock.calls[0][0];
    expect(press).toMatchObject({
      button: "secondary",
      x: 20,
      y: 30,
      pageX: 30,
      metaKey: true
    });
    press.preventDefault();
    expect(event.preventDefault).toHaveBeenCalled();

    out.onAuxClick(mouseEvent({ button: 1 }));
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(onPress.mock.calls[1][0].button).toBe("auxiliary");
    out.onAuxClick(mouseEvent({ button: 2 }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("maps the value-only change handlers onto onChange", () => {
    const onChangeText = vi.fn();
    const onChange = vi.fn();
    const text = passed({ onChangeText, onChange });
    const event = { target: { value: "abc", checked: true } };
    text.onChange(event);
    expect(onChange).toHaveBeenCalledWith(event);
    expect(onChangeText).toHaveBeenCalledWith("abc");

    const onCheckedChange = vi.fn();
    passed({ onCheckedChange }).onChange(event);
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    const asNumber = vi.fn();
    passed({ onValueChange: asNumber }, { value: "number" }).onChange({
      target: { value: "42" }
    });
    expect(asNumber).toHaveBeenCalledWith(42);
    const asString = vi.fn();
    passed({ onValueChange: asString }).onChange({ target: { value: "42" } });
    expect(asString).toHaveBeenCalledWith("42");
  });

  it("submits on Enter only and keeps the caller's onKeyDown", () => {
    const onSubmitEditing = vi.fn();
    const onKeyDown = vi.fn();
    const out = passed({ onSubmitEditing, onKeyDown });
    out.onKeyDown({ key: "a", currentTarget: { value: "x" } });
    expect(onSubmitEditing).not.toHaveBeenCalled();
    out.onKeyDown({ key: "Enter", currentTarget: { value: "done" } });
    expect(onSubmitEditing).toHaveBeenCalledWith("done");
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it("gives old layout classes, and a Box with display flex the row class", () => {
    expect(passed({}, { className: "nn-box" }).className).toBe("nn-box");
    expect(
      passed({ sx: { display: "flex" }, className: "mine" }, { className: "nn-box" })
        .className
    ).toBe("mine nn-flex");
  });

  it("applies default styles under the caller's sx", () => {
    expect(
      passed({ sx: { p: 1 } }, { sx: { display: "flex", p: 0 } }).sx
    ).toEqual({ display: "flex", p: 1 });
  });

  it("turns Select options into option children", () => {
    const out = passed({
      options: [
        { value: "a", title: "A" },
        { value: "b", title: "B", disabled: true }
      ]
    });
    const Select = (props: Props) => createElement("select", null, props.children);
    expect(renderToStaticMarkup(createElement(Select, out))).toBe(
      '<select><option value="a">A</option><option value="b" disabled="">B</option></select>'
    );
  });

  it("hands the payload from an old-style drag to the drop target", () => {
    const source = passed({
      draggable: true,
      onDragStart: () => ({ id: "note-1" })
    });
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: "",
      dropEffect: "move",
      files: []
    };
    source.onDragStart({ dataTransfer });
    expect(dataTransfer.setData).toHaveBeenCalled();

    const onDrop = vi.fn();
    const target = passed({ droppable: true, onDrop });
    const drop = { ...mouseEvent(), dataTransfer };
    target.onDrop(drop);
    expect(drop.preventDefault).toHaveBeenCalled();
    expect(onDrop.mock.calls[0][0]).toMatchObject({
      payload: { id: "note-1" },
      x: 30,
      y: 50
    });

    const onDragEnd = vi.fn();
    passed({ draggable: true, onDragStart: () => 1, onDragEnd }).onDragEnd({
      dataTransfer
    });
    expect(onDragEnd.mock.calls[0][0].dropped).toBe(true);
    const later = vi.fn();
    passed({ droppable: true, onDrop: later }).onDrop({
      ...mouseEvent(),
      dataTransfer
    });
    expect(later.mock.calls[0][0].payload).toBeUndefined();
  });

  it("filters dropped files by acceptsFiles and skips onDrop for files", () => {
    const onDropFiles = vi.fn();
    const onDrop = vi.fn();
    const out = passed({ onDropFiles, onDrop, acceptsFiles: [".txt", "image/*"] });
    const file = (name: string, type: string) => ({
      name,
      type,
      size: 1,
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(0)
    });
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:x");
    out.onDrop({
      ...mouseEvent(),
      dataTransfer: {
        files: [
          file("a.TXT", "text/plain"),
          file("b.png", "image/png"),
          file("c.pdf", "application/pdf")
        ]
      }
    });
    createObjectURL.mockRestore();
    expect(onDrop).not.toHaveBeenCalled();
    expect(onDropFiles.mock.calls[0][0].map((f: Props) => f.name)).toEqual([
      "a.TXT",
      "b.png"
    ]);
  });
});
