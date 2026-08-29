import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import { describe, expect, test } from "vitest";
import { BlockId } from "../../block-id/block-id.js";
import TableCell from "../../table-cell/index.js";
import TableHeader from "../../table-header/index.js";
import { columnResizingPluginKey } from "../prosemirror-tables/columnresizing.js";
import { Table } from "../index.js";
import { Page, Paging } from "../../paging/index.js";

const PagedDocument = Node.create({
  name: "doc",
  topNode: true,
  content: "(page | block)+"
});

function createEditor(rows: number) {
  let html = `<p data-block-id="p1">intro</p><table data-block-id="t1"><tbody>`;
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
      PagedDocument,
      Page,
      BlockId,
      Paging.configure({ enabled: true, pageSize: 50, thresholdBlocks: 100 })
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

  test("a windowed table only gets handles for the rows on screen", async () => {
    const editor = createEditor(2000);
    await new Promise((r) => setTimeout(r, 0));

    editor.commands.setTextSelection(12);
    // 4000 cells in the table, but only the rendered run is worth a handle
    const built = handles(editor);
    expect(built).toBeGreaterThan(0);
    expect(built).toBeLessThan(200);
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
    // same handles -- rebuilding means a fresh table map over every cell.
    // Compared by identity: two freshly built handles look alike.
    const after = handleElements(editor);
    expect(after).toHaveLength(before.length);
    expect(after[0]).toBe(before[0]);
    expect(after[after.length - 1]).toBe(before[before.length - 1]);
    editor.destroy();
  });
});
