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
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import { describe, expect, test, vi } from "vitest";
import { TableMap } from "../prosemirror-tables/tablemap.js";
import TableCell from "../../table-cell/index.js";
import TableHeader from "../../table-header/index.js";
import { columnResizingPluginKey } from "../prosemirror-tables/columnresizing.js";
import { Table } from "../index.js";

const Document = Node.create({
  name: "doc",
  topNode: true,
  content: "block+"
});

function createEditor(rows: number) {
  let html = `<p>intro</p><table><tbody>`;
  for (let i = 0; i < rows; i++)
    html += `<tr><td><p>Cell ${i}</p></td><td><p>Value ${i}</p></td></tr>`;
  html += "</tbody></table>";

  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Document
    ],
    content: html
  });
}

/** The handle elements themselves, to tell reuse from rebuilding. */
function handleElements(editor: Editor) {
  return (
    columnResizingPluginKey
      .getState(editor.state)
      ?.decorations.find()
      .map(
        (decoration) =>
          (decoration as unknown as { type: { toDOM: Node } }).type.toDOM
      ) ?? []
  );
}

/** How many handles were built, drawn or not. */
function handles(editor: Editor) {
  return (
    columnResizingPluginKey.getState(editor.state)?.decorations.find().length ??
    0
  );
}

describe("column resize handles", () => {
  test("a small table gets a handle for every cell", async () => {
    const editor = createEditor(10);
    await new Promise((r) => setTimeout(r, 0));

    editor.commands.setTextSelection(12);
    expect(handles(editor)).toBe(20);
    editor.destroy();
  });

  test("typing does not rebuild the handles", async () => {
    const editor = createEditor(2000);
    await new Promise((r) => setTimeout(r, 0));

    // put the caret in a cell inside the rendered run, where typing moves the
    // end of that run along with it
    const table = editor.state.doc.child(1);
    let at = editor.state.doc.child(0).nodeSize + 1;
    for (let i = 0; i < 5; i++) at += table.child(i).nodeSize;
    editor.commands.setTextSelection(at + 3);

    const before = handleElements(editor);
    expect(before.length).toBeGreaterThan(0);
    editor.commands.insertContent("x");
    editor.commands.insertContent("y");

    // mapped along with the text rather than built again, so they are the very
    // same handles. Compared by identity: two freshly built handles look alike.
    const after = handleElements(editor);
    expect(after).toHaveLength(before.length);
    expect(after[0]).toBe(before[0]);
    editor.destroy();
  });

  test("typing does not build the table map again", () => {
    // building the handles walks the map, and the map walks every cell of the
    // table -- far too much to do on every keystroke
    const editor = createEditor(2000);
    const table = editor.state.doc.child(1);
    let at = editor.state.doc.child(0).nodeSize + 1;
    for (let i = 0; i < 5; i++) at += table.child(i).nodeSize;
    editor.commands.setTextSelection(at + 3);
    editor.commands.insertContent("x");

    const built = vi.spyOn(TableMap, "get");
    editor.commands.insertContent("y");
    expect(built).not.toHaveBeenCalled();

    built.mockRestore();
    editor.destroy();
  });
});
