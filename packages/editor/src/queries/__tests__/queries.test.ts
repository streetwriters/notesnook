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

import { describe, expect, test, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { createEditor } from "../../../test-utils/index.js";
import { getQueryStore, q, useEditorQuery } from "../index.js";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function setup() {
  const { editor } = createEditor({
    extensions: {},
    initialContent: "<p>hello world</p><p>second line</p>"
  });
  editor.commands.setTextSelection({ from: 1, to: 6 });
  return { editor, store: getQueryStore(editor) };
}

describe("query store", () => {
  test("notifies only the queries whose answer changed", () => {
    const { editor, store } = setup();
    const calls: string[] = [];
    store.subscribe(q.isActive("bold"), () => calls.push("bold"));
    store.subscribe(q.isActive("italic"), () => calls.push("italic"));

    expect(store.read(q.isActive("bold"))).toBe(false);
    editor.commands.toggleBold();
    expect(store.read(q.isActive("bold"))).toBe(true);
    expect(calls).toEqual(["bold"]);

    editor.commands.setTextSelection({ from: 2, to: 4 });
    expect(calls).toEqual(["bold"]);
  });

  test("a list of node names is active when any of them is", () => {
    const { editor, store } = setup();
    const query = q.isActive(["bold", "italic"]);
    store.subscribe(query, () => undefined);
    expect(store.read(query)).toBe(false);
    editor.commands.toggleItalic();
    expect(store.read(query)).toBe(true);
  });

  test("builders return the same query for the same arguments", () => {
    expect(q.isActive("bold")).toBe(q.isActive("bold"));
    expect(q.isActive("callout", { type: "info" })).toBe(
      q.isActive("callout", { type: "info" })
    );
  });
});

describe("full query set", () => {
  test("attributes, selectedNode, editable, search and textDirection answer", () => {
    const { editor, store } = setup();
    expect(store.read(q.attributes("paragraph"))).toBeTypeOf("object");
    expect(store.read(q.selectedNode("paragraph"))).toBeTypeOf("object");
    expect(store.read(q.selectedNode("table"))).toBeNull();
    expect(store.read(q.editable())).toBe(true);
    expect(store.read(q.search())).toEqual({ count: 0, selectedIndex: 0 });
    editor.setEditable(false);
    expect(store.read(q.editable())).toBe(false);
  });

  test("can follows the command's availability", () => {
    const { editor, store } = setup();
    const can = q.can("toggleBold");
    store.subscribe(can, () => undefined);
    const undo = q.can("undo");
    store.subscribe(undo, () => undefined);
    expect(store.read(can)).toBe(true);
    expect(store.read(undo)).toBe(false);
    expect(store.read(q.can("noSuchCommand"))).toBe(false);
    editor.commands.toggleBold();
    expect(store.read(undo)).toBe(true);
  });

  test("selection reports the range and updates on every transaction", () => {
    const { editor, store } = setup();
    const query = q.selection();
    const calls: number[] = [];
    store.subscribe(query, () => calls.push(1));
    expect(store.read(query)).toEqual({ from: 1, to: 6, empty: false });
    editor.commands.setTextSelection(3);
    expect(store.read(query)).toEqual({ from: 3, to: 3, empty: true });
    expect(calls).toHaveLength(1);
  });

  test("history tracks undo and redo availability", () => {
    const { editor, store } = setup();
    const query = q.history();
    store.subscribe(query, () => undefined);
    expect(store.read(query)).toEqual({ canUndo: false, canRedo: false });
    editor.commands.toggleBold();
    expect(store.read(query)).toEqual({ canUndo: true, canRedo: false });
    editor.commands.undo();
    expect(store.read(query)).toEqual({ canUndo: false, canRedo: true });
  });

  test("anchor is built from coordsAtPos", () => {
    const { editor, store } = setup();
    const spy = vi
      .spyOn(editor.view, "coordsAtPos")
      .mockImplementation((pos: number) => ({
        top: pos,
        bottom: pos + 10,
        left: pos * 2,
        right: pos * 2 + 1
      }));
    const query = q.anchor();
    store.subscribe(query, () => undefined);
    expect(store.read(query)).toEqual({
      top: 1,
      bottom: 16,
      left: 2,
      right: 13
    });
    editor.commands.setTextSelection(3);
    expect(store.read(query)).toEqual({
      top: 3,
      bottom: 13,
      left: 6,
      right: 7
    });
    expect(store.read(q.anchor({ node: "table" }))).toBeNull();
    expect(store.read(q.anchor({ node: "paragraph" }))).not.toBeNull();
    spy.mockRestore();
  });

  test("focused follows editor focus", () => {
    const { editor, store } = setup();
    store.subscribe(q.focused(), () => undefined);
    expect(store.read(q.focused())).toBe(editor.isFocused);
  });
});

describe("useEditorQuery", () => {
  test("re-renders a component only when its own answer changes", () => {
    const { editor } = setup();
    const renders = { bold: 0, italic: 0 };

    function Bold() {
      renders.bold++;
      return String(useEditorQuery(editor, q.isActive("bold"), false));
    }
    function Italic() {
      renders.italic++;
      return String(useEditorQuery(editor, q.isActive("italic"), false));
    }

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() =>
      root.render([
        createElement(Bold, { key: "b" }),
        createElement(Italic, { key: "i" })
      ])
    );
    const initial = { ...renders };
    expect(container.textContent).toBe("falsefalse");

    act(() => {
      editor.commands.setTextSelection({ from: 2, to: 4 });
    });
    expect(renders).toEqual(initial);

    act(() => {
      editor.commands.toggleBold();
    });
    expect(container.textContent).toBe("truefalse");
    expect(renders).toEqual({ bold: initial.bold + 1, italic: initial.italic });

    act(() => root.unmount());
  });
});
