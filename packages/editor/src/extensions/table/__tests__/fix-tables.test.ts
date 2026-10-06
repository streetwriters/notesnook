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
import { Table } from "../index.js";

const Document = Node.create({ name: "doc", topNode: true, content: "block+" });

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({ document: false }),
      Document,
      Table,
      TableRow,
      TableCell,
      TableHeader
    ],
    content
  });
}

function rows(cells: string[][]) {
  return cells
    .map((row) => `<tr>${row.map((c) => `<td><p>${c}</p></td>`).join("")}</tr>`)
    .join("");
}

describe("fixing tables", () => {
  test("a row short of a cell is filled in on the first edit", () => {
    const editor = createEditor(
      `<table><tbody>${rows([["a", "b"], ["c"]])}</tbody></table>`
    );
    expect(editor.state.doc.child(0).child(1).childCount).toBe(1);

    editor.commands.setTextSelection(4);
    editor.commands.insertContent("!");

    expect(editor.state.doc.child(0).child(1).childCount).toBe(2);
    editor.destroy();
  });

  test("editing a cell leaves the shape alone", () => {
    const editor = createEditor(
      `<table><tbody>${rows([
        ["a", "b"],
        ["c", "d"]
      ])}</tbody></table>`
    );
    editor.commands.setTextSelection(4);
    editor.commands.insertContent("!");

    const table = editor.state.doc.child(0);
    expect(table.childCount).toBe(2);
    expect(table.child(0).childCount).toBe(2);
    expect(editor.getText()).toContain("!");
    editor.destroy();
  });

  test("editing a cell does not build the table map again", () => {
    // the map is what makes checking a table expensive: it walks every cell,
    // and it is rebuilt whenever the table node changes -- which is every
    // keystroke inside one
    const editor = createEditor(
      `<table><tbody>${rows([
        ["a", "b"],
        ["c", "d"]
      ])}</tbody></table>`
    );
    editor.commands.setTextSelection(4);
    editor.commands.insertContent("!");

    const built = vi.spyOn(TableMap, "get");
    editor.commands.insertContent("?");
    expect(built).not.toHaveBeenCalled();

    built.mockRestore();
    editor.destroy();
  });

  test("a row deleted down to nothing is still repaired", () => {
    const editor = createEditor(
      `<table><tbody>${rows([
        ["a", "b"],
        ["c", "d"]
      ])}</tbody></table>`
    );
    const table = editor.state.doc.child(0);
    const secondRow = 1 + table.child(0).nodeSize;
    // drop one cell from the second row, leaving the table ragged
    editor.view.dispatch(
      editor.state.tr.delete(
        secondRow + 1,
        secondRow + 1 + table.child(1).child(0).nodeSize
      )
    );

    const fixed = editor.state.doc.child(0);
    expect(fixed.child(1).childCount).toBe(2);
    editor.destroy();
  });
});
