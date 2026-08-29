import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import { describe, expect, test } from "vitest";
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
