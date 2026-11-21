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

import { afterEach, describe, expect, test, vi } from "vitest";
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "../extensions/table-cell/index.js";
import TableHeader from "../extensions/table-header/index.js";
import { Table } from "../extensions/table/index.js";
import { Link } from "../extensions/link/index.js";
import {
  findOffsetMark,
  getQueryStore,
  q,
  tiptapController
} from "@notesnook/editor-ui";

const Document = Node.create({
  name: "doc",
  topNode: true,
  content: "block+"
});

const HTML =
  '<p>see <a href="https://notesnook.com">the site</a> now</p>' +
  "<table><tbody>" +
  "<tr><td><p>a1</p></td><td><p>b1</p></td></tr>" +
  "<tr><td><p>a2</p></td><td><p>b2</p></td></tr>" +
  "<tr><td><p>a3</p></td><td><p>b3</p></td></tr>" +
  "</tbody></table>";

const editors: Editor[] = [];
afterEach(() => {
  // a live editor keeps a DOM observer timer that outlives the test
  for (const editor of editors.splice(0))
    if (!editor.isDestroyed) editor.destroy();
});

function setup() {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      Link,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Document
    ],
    content: HTML
  });
  editors.push(editor);
  const controller = tiptapController(editor);
  return { editor, controller, store: getQueryStore(editor) };
}

/** The position inside the first cell whose text is `text`. */
function posInCell(editor: Editor, text: string) {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.isText && node.text === text) found = pos + 1;
  });
  return found;
}

/** The table cell that holds the text. */
function cellWith(editor: Editor, text: string) {
  const $pos = editor.state.doc.resolve(posInCell(editor, text));
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === "tableCell") return node;
  }
  return undefined;
}

function cellTexts(editor: Editor) {
  const rows: string[][] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "tableRow")
      rows.push(
        node.content.content.map(
          (cell: { textContent: string }) => cell.textContent
        )
      );
  });
  return rows;
}

describe("selectionOffset and nodeAt queries", () => {
  test("selectionOffset is the text run under the caret with its marks", () => {
    const { editor, store } = setup();
    const query = q.selectionOffset();
    store.subscribe(query, () => undefined);

    editor.commands.setTextSelection(posInCell(editor, "a1"));
    expect(store.read(query)).toMatchObject({ text: "a1", isText: true });

    // "see " is 4 characters, so the link text starts at position 5
    editor.commands.setTextSelection(7);
    const offset = store.read(query);
    expect(offset).toMatchObject({ from: 5, to: 13, text: "the site" });
    expect(findOffsetMark(offset, "link")?.attrs.href).toBe(
      "https://notesnook.com"
    );
  });

  test("selectionOffset is notified only when the run changes", () => {
    const { editor, store } = setup();
    const calls: number[] = [];
    editor.commands.setTextSelection(7);
    store.subscribe(q.selectionOffset(), () => calls.push(1));
    editor.commands.setTextSelection(9);
    expect(calls).toHaveLength(0);
    editor.commands.setTextSelection(2);
    expect(calls).toHaveLength(1);
  });

  test("nodeAt describes the node at a position and is null elsewhere", () => {
    const { store } = setup();
    expect(store.read(q.nodeAt(0))).toMatchObject({ from: 0, isText: false });
    expect(store.read(q.nodeAt(5))).toMatchObject({
      from: 5,
      text: "the site",
      isText: true
    });
    expect(store.read(q.nodeAt(-1))).toBeNull();
    expect(store.read(q.nodeAt(100000))).toBeNull();
  });

  test("the anchor of a node target is the node's own box", () => {
    const { editor, store } = setup();
    editor.commands.setTextSelection(posInCell(editor, "a1"));
    const box = {
      top: 10,
      left: 20,
      right: 120,
      bottom: 50,
      width: 100,
      height: 40
    };
    const spy = vi.spyOn(editor.view, "nodeDOM").mockReturnValue({
      getBoundingClientRect: () => box,
      nodeType: 1
    } as unknown as globalThis.Node);
    // happy-dom elements are HTMLElement instances; the stand-in is not one,
    // so the store falls back to coordsAtPos, which is null-safe in jsdom.
    const query = q.anchor({ node: ["tableCell", "tableHeader"] });
    store.subscribe(query, () => undefined);
    expect(store.read(query)).not.toBeNull();
    expect(store.read(q.anchor({ node: "table" }))).not.toBeNull();
    editor.commands.setTextSelection(2);
    expect(
      store.read(q.anchor({ node: ["tableCell", "tableHeader"] }))
    ).toBeNull();
    spy.mockRestore();
  });
});

describe("controller", () => {
  test("onDestroy runs when the editor is destroyed and can be undone", () => {
    const { editor, controller } = setup();
    const kept = vi.fn();
    const removed = vi.fn();
    controller.onDestroy(kept);
    controller.onDestroy(removed)();
    editor.destroy();
    expect(kept).toHaveBeenCalledTimes(1);
    expect(removed).not.toHaveBeenCalled();
  });

  test("posAtElement is undefined for an element outside the editor", () => {
    const { controller } = setup();
    expect(controller.posAtElement?.(document.createElement("p"))).toBe(
      undefined
    );
  });

  test("host actions come from editor.storage and follow later changes", () => {
    const { editor, controller } = setup();
    expect(controller.hostActions?.getLinkData).toBeUndefined();
    const getLinkData = vi.fn(async () => undefined);
    (editor.storage as Record<string, unknown>).getLinkData = getLinkData;
    expect(controller.hostActions?.getLinkData).toBe(getLinkData);
  });
});

describe("link commands", () => {
  test("setLink edits the link under the caret", () => {
    const { editor, controller } = setup();
    editor.commands.setTextSelection(7);
    controller.run({
      name: "setLink",
      args: [{ href: "https://example.com", title: "the site" }]
    });
    expect(editor.getHTML()).toContain('href="https://example.com"');
    expect(editor.getHTML()).not.toContain("https://notesnook.com");
  });

  test("extendMarkRange then unsetLink removes the whole link", () => {
    const { editor, controller } = setup();
    editor.commands.setTextSelection(7);
    controller.run(
      { name: "extendMarkRange", args: ["link"] },
      { name: "unsetLink" }
    );
    expect(editor.getHTML()).not.toContain("<a");
    expect(editor.getHTML()).toContain("the site");
  });
});

describe("table commands", () => {
  test("deleteRow and deleteColumn act on the cell holding the caret", () => {
    const { editor, controller } = setup();
    editor.commands.setTextSelection(posInCell(editor, "a1"));
    controller.run({ name: "deleteRow" });
    expect(cellTexts(editor)).toEqual([
      ["a2", "b2"],
      ["a3", "b3"]
    ]);

    editor.commands.setTextSelection(posInCell(editor, "a2"));
    controller.run({ name: "deleteColumn" });
    expect(cellTexts(editor)).toEqual([["b2"], ["b3"]]);
  });

  test("setCellAttribute sets one attribute on the selected cell", () => {
    const { editor, controller } = setup();
    editor.commands.setTextSelection(posInCell(editor, "b1"));
    controller.run({
      name: "setCellAttribute",
      args: ["backgroundColor", "#ff0000"]
    });
    expect(cellWith(editor, "b1")?.attrs.backgroundColor).toBe("#ff0000");
    expect(cellWith(editor, "a1")?.attrs.backgroundColor).toBeFalsy();
  });

  test("moveRowUp and moveColumnLeft reorder the table", () => {
    const { editor, controller } = setup();
    // the first row is the header row and never moves
    editor.commands.setTextSelection(posInCell(editor, "a3"));
    controller.run({ name: "moveRowUp" });
    expect(cellTexts(editor)).toEqual([
      ["a1", "b1"],
      ["a3", "b3"],
      ["a2", "b2"]
    ]);

    editor.commands.setTextSelection(posInCell(editor, "b1"));
    controller.run({ name: "moveColumnLeft" });
    expect(cellTexts(editor)).toEqual([
      ["b1", "a1"],
      ["b3", "a3"],
      ["b2", "a2"]
    ]);

    // already first: nothing moves
    const before = editor.getHTML();
    editor.commands.setTextSelection(posInCell(editor, "b1"));
    controller.run({ name: "moveColumnLeft" });
    expect(editor.getHTML()).toBe(before);
  });

  test("selectTableRow and selectTableColumn move the caret to the next row or column", () => {
    const { editor, controller } = setup();
    editor.commands.setTextSelection(posInCell(editor, "a1"));
    controller.run({ name: "selectTableRow", args: ["next"] });
    expect(editor.state.selection.$from.parent.textContent).toBe("a2");

    controller.run({ name: "selectTableColumn", args: ["next"] });
    expect(editor.state.selection.$from.parent.textContent).toBe("b2");

    controller.run({ name: "selectTableRow", args: ["prev"] });
    expect(editor.state.selection.$from.parent.textContent).toBe("b1");
  });
});
