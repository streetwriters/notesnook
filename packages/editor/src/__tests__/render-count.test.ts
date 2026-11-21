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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import { createEditor } from "../../test-utils/index.js";
import {
  Toolbar,
  q,
  tiptapController,
  useControllerQuery,
  type ToolbarGroupDefinition
} from "@notesnook/editor-ui";
import TableCell from "../extensions/table-cell/index.js";
import TableHeader from "../extensions/table-header/index.js";
import { Table } from "../extensions/table/index.js";
import { Link } from "../extensions/link/index.js";

const Document = Node.create({
  name: "doc",
  topNode: true,
  content: "block+"
});

// Counts every render of a tool's ToolButton element. A tool that re-renders
// produces a new ToolButton element, so a non-memoised wrapper sees it even
// when the real (memoised) button would skip the DOM work.
const counts = vi.hoisted(() => new Map<string, number>());
vi.mock(
  "@notesnook/editor-ui/toolbar/components/tool-button.js",
  async (importOriginal) => {
    const original = await importOriginal<{
      ToolButton: ComponentType<never>;
    }>();
    const { createElement: h } = await import("react");
    return {
      ...original,
      ToolButton: (props: { id?: string; icon: string }) => {
        const key = props.id || props.icon;
        counts.set(key, (counts.get(key) || 0) + 1);
        return h(original.ToolButton, props as never);
      }
    };
  }
);

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
const editors: Editor[] = [];
beforeEach(() => counts.clear());
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  // a live editor keeps a DOM observer timer that outlives the test
  for (const editor of editors.splice(0))
    if (!editor.isDestroyed) editor.destroy();
});

function renderToolbar(html: string, selection: { from: number; to: number }) {
  const { editor } = createEditor({ extensions: {}, initialContent: html });
  editors.push(editor);
  editor.commands.setTextSelection(selection);
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      createElement(
        EmotionThemeProvider,
        { scope: "editorToolbar" },
        createElement(Toolbar, {
          editor,
          location: "top",
          tools: [["bold", "italic", "underline"]],
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  return { editor };
}

function snapshot() {
  return Object.fromEntries(counts);
}

// The keys the mocked ToolButton counts under (its id, else its icon).
const LINK_KEYS = ["link", "linkEdit", "linkRemove", "openLink", "copyLink"];
const TABLE_KEYS = ["insertColumnLeft", "insertRowBelow", "deleteRow"];

/** The position of the first character in the table's first cell. */
function cellStart(editor: Editor) {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.isText && node.text === "a1") found = pos;
  });
  return found;
}

// (the colour tools read localStorage, which this test environment lacks)
const LINK_AND_TABLE_TOOLS: ToolbarGroupDefinition = [
  "addLink",
  "editLink",
  "removeLink",
  "openLink",
  "copyLink",
  "tableSettings",
  "insertColumnLeft",
  "insertRowBelow",
  "deleteRow"
];

function renderLinkAndTableToolbar(selection: number) {
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
    content:
      "<p>one</p><p>two</p>" +
      '<p>see <a href="https://notesnook.com">the site</a> now</p>' +
      "<table><tbody><tr><td><p>a1</p></td><td><p>b1</p></td></tr>" +
      "<tr><td><p>a2</p></td><td><p>b2</p></td></tr></tbody></table>"
  });
  editors.push(editor);
  editor.commands.setTextSelection(selection);
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      createElement(
        EmotionThemeProvider,
        { scope: "editorToolbar" },
        createElement(Toolbar, {
          editor,
          location: "top",
          tools: [LINK_AND_TABLE_TOOLS],
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  return { editor };
}

describe("link and table tool render counts", () => {
  test("mounts the link and table tools", () => {
    renderLinkAndTableToolbar(2);
    expect(Object.keys(snapshot()).length).toBeGreaterThan(3);
  });

  test("moving the caret between two plain paragraphs re-renders no link or table tool", () => {
    const { editor } = renderLinkAndTableToolbar(2);
    const before = snapshot();
    act(() => {
      editor.commands.setTextSelection(7);
    });
    act(() => {
      editor.commands.setTextSelection(3);
    });
    expect(snapshot()).toEqual(before);
  });

  test("moving the caret inside one link re-renders no tool", () => {
    // "see " is at 11-15 and the link text at 15-23
    const { editor } = renderLinkAndTableToolbar(17);
    const inLink = snapshot();
    act(() => {
      editor.commands.setTextSelection(19);
    });
    act(() => {
      editor.commands.setTextSelection(21);
    });
    expect(snapshot()).toEqual(inLink);
  });

  test("moving the caret inside one table cell re-renders no tool", () => {
    const { editor } = renderLinkAndTableToolbar(2);
    const cell = cellStart(editor);
    act(() => {
      editor.commands.setTextSelection(cell);
    });
    const inCell = snapshot();
    act(() => {
      editor.commands.setTextSelection(cell + 1);
    });
    expect(snapshot()).toEqual(inCell);
  });

  test("moving the caret into a link re-renders the link tools but not the table tools", () => {
    const { editor } = renderLinkAndTableToolbar(2);
    const before = snapshot();
    act(() => {
      editor.commands.setTextSelection(17);
    });
    const after = snapshot();
    for (const key of TABLE_KEYS) expect(after[key]).toBe(before[key]);
    const changed = Object.keys(after).filter(
      (key) => after[key] !== before[key]
    );
    expect(changed.length).toBeGreaterThan(0);
    for (const key of changed) expect(LINK_KEYS).toContain(key);
  });
});

describe("hover popup render counts", () => {
  test("a view of the node at a position re-renders only when that node changes", () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ document: false }), Link, Document],
      content:
        "<p>one</p><p>two</p>" +
        '<p>see <a href="https://notesnook.com">the site</a> now</p>'
    });
    editors.push(editor);
    const controller = tiptapController(editor);
    let renders = 0;
    // the hover popup reads the node under the pointer this way; the link
    // text starts at position 15
    function Probe() {
      renders++;
      const node = useControllerQuery(controller, q.nodeAt(15));
      return createElement("span", null, node?.text ?? "");
    }
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root?.render(createElement(Probe)));
    const mounted = renders;

    // caret moves and typing elsewhere do not touch the node at 15
    act(() => {
      editor.commands.setTextSelection(2);
    });
    act(() => {
      editor.commands.setTextSelection(7);
    });
    expect(renders).toBe(mounted);

    // changing the link text itself does
    act(() => {
      editor.commands.setTextSelection({ from: 15, to: 23 });
      editor.commands.insertContent("a link");
    });
    expect(renders).toBeGreaterThan(mounted);
  });
});

describe("toolbar render counts", () => {
  test("mounts each tool", () => {
    renderToolbar("<p>one</p><p>two</p>", { from: 1, to: 1 });
    const mounted = snapshot();
    expect(Object.keys(mounted).sort()).toEqual([
      "bold",
      "italic",
      "underline"
    ]);
    for (const count of Object.values(mounted))
      expect(count).toBeLessThanOrEqual(2);
  });

  test("moving the caret between two plain paragraphs re-renders no tool", () => {
    const { editor } = renderToolbar("<p>one</p><p>two</p>", {
      from: 1,
      to: 1
    });
    const before = snapshot();

    act(() => {
      editor.commands.setTextSelection(6);
    });
    act(() => {
      editor.commands.setTextSelection(2);
    });

    expect(snapshot()).toEqual(before);
  });

  test("toggling bold re-renders only the bold tool", () => {
    const { editor } = renderToolbar("<p>hello world</p>", {
      from: 1,
      to: 6
    });
    const before = snapshot();

    act(() => {
      editor.commands.toggleBold();
    });

    const after = snapshot();
    expect(after.bold).toBeGreaterThan(before.bold);
    expect(after.italic).toBe(before.italic);
    expect(after.underline).toBe(before.underline);
    // one transaction, at most one extra render of the bold tool
    expect(after.bold - before.bold).toBeLessThanOrEqual(1);
  });
});
