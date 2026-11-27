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

// The toolbar's popups on the web target of @notesnook/ui-kit, as apps/web
// draws them: typed text reaches them through DOM `onChange` events and Enter
// through `onKeyDown`.

import { afterEach, describe, expect, test } from "vitest";
import { act, createElement, type ReactElement } from "react";
import { createRoot, Root } from "react-dom/client";
import { EmotionThemeProvider } from "@notesnook/theme";
import { Editor, type JSONContent } from "@tiptap/core";
import { createEditor } from "../../test-utils/index.js";
import {
  Toolbar,
  useToolbarStore,
  type ToolbarDefinition
} from "@notesnook/editor-ui";
import { strings } from "@notesnook/intl";
import { Link } from "../extensions/link/index.js";
import { TablePopup } from "@notesnook/editor-ui/toolbar/popups/table-popup.js";
import { Table } from "../extensions/table/index.js";
import TableCell from "../extensions/table-cell/index.js";
import TableHeader from "../extensions/table-header/index.js";
import TableRow from "@tiptap/extension-table-row";
import { EmbedNode } from "../extensions/embed/index.js";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
const editors: Editor[] = [];
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  for (const editor of editors.splice(0))
    if (!editor.isDestroyed) editor.destroy();
  useToolbarStore.getState().setIsMobile(false);
  document.body.innerHTML = "";
});

type TableSize = { columns: number; rows: number };

function renderInline(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root?.render(
      createElement(
        EmotionThemeProvider,
        { scope: "editorToolbar" },
        element
      )
    )
  );
}

function renderToolbar(tools: ToolbarDefinition) {
  const { editor } = createEditor({
    extensions: {
      link: Link,
      table: Table,
      tableRow: TableRow,
      tableCell: TableCell,
      tableHeader: TableHeader,
      embed: EmbedNode,
      textStyle: TextStyle,
      color: Color.configure({ types: ["textStyle"] })
    },
    initialContent: "<p>hello world</p>"
  });
  editors.push(editor);
  editor.commands.setTextSelection({ from: 1, to: 6 });
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
          tools,
          defaultFontFamily: "sans-serif",
          defaultFontSize: 16
        })
      )
    )
  );
  return editor;
}

function click(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`${selector} is not rendered`);
  act(() => element.click());
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(input: HTMLElement, key: string) {
  act(() => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}

function input(placeholder: string) {
  const element = Array.from(document.querySelectorAll("input")).find(
    (item) => item.placeholder === placeholder
  );
  if (!element) throw new Error(`no input with placeholder ${placeholder}`);
  return element;
}

function countMatches(text: string, pattern: RegExp) {
  return (text.match(pattern) ?? []).length;
}

function findNode(node: JSONContent, type: string): JSONContent | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

function openInsertTable() {
  click('[data-test-id="tool-insertBlock"]');
  click('[data-test-id="menu-button-table"]');
}

describe("toolbar popups on the web kit", () => {
  test("the link popup reads typed text and inserts the link on Enter", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    const url = input("https://example.com/");
    type(url, "https://notesnook.com");
    press(url, "Enter");

    expect(editor.isActive("link")).toBe(true);
    expect(editor.getHTML()).toContain('href="https://notesnook.com/"');
    expect(
      document.querySelector('input[placeholder="https://example.com/"]')
    ).toBeNull();
  });

  test("the link popup shows an error for an invalid URL and keeps the text", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    const url = input("https://example.com/");
    type(url, "not a url");
    press(url, "Enter");

    expect(editor.isActive("link")).toBe(false);
    expect(input("https://example.com/").value).toBe("not a url");
  });

  test("the link popup's action button applies the typed link text", () => {
    const editor = renderToolbar([["addLink"]]);
    click("#tool-link");

    type(input("https://example.com/"), "https://notesnook.com");
    click('[data-test-id="popup-action"]');

    expect(editor.isActive("link")).toBe(true);
  });
});

describe("table popup on the web kit", () => {
  test("a cell of the size grid inserts a table of that size", () => {
    const editor = renderToolbar([["insertBlock"]]);
    openInsertTable();

    const grid = document.querySelector<HTMLElement>(
      '[data-test-id="table-size-grid"]'
    );
    // the third cell of the second row: a table of 2 rows and 3 columns
    const cell = grid?.children[1]?.children[2];
    if (!(cell instanceof HTMLElement))
      throw new Error("no grid cell at row 2, column 3");
    act(() => cell.click());

    const html = editor.getHTML();
    expect(countMatches(html, /<tr[\s>]/g)).toBe(2);
    expect(countMatches(html, /<(td|th)[\s>]/g)).toBe(6);
  });
});

describe("table popup's size inputs on the web kit", () => {
  // On mobile the insert-block sheet renders no items (a separate issue), so
  // the popup is rendered on its own here.
  test("on mobile, the column and row inputs set the size that is inserted", () => {
    useToolbarStore.getState().setIsMobile(true);
    const sizes: TableSize[] = [];
    renderInline(
      createElement(TablePopup, {
        onInsertTable: (size: TableSize) => {
          sizes.push(size);
        }
      })
    );

    const [columns, rows] = document.querySelectorAll<HTMLInputElement>(
      'input[type="number"]'
    );
    if (!columns || !rows)
      throw new Error("the column and row inputs are not rendered");
    type(columns, "3");
    type(rows, "2");
    click('[data-test-id="popup-action"]');

    expect(sizes).toEqual([{ columns: 3, rows: 2 }]);
  });
});

describe("embed popup on the web kit", () => {
  test("the URL and width fields insert an embed of that width", () => {
    const editor = renderToolbar([["insertBlock"]]);
    click('[data-test-id="tool-insertBlock"]');
    click('[data-test-id="menu-button-embed"]');

    type(
      input(strings.enterEmbedSourceURL()),
      "https://example.com/embed/video"
    );
    type(input(strings.width()), "640");
    click('[data-test-id="popup-action"]');

    const embed = findNode(editor.getJSON(), "embed");
    expect(embed?.attrs).toMatchObject({
      src: "https://example.com/embed/video",
      width: 640
    });
  });
});

describe("colour picker on the web kit", () => {
  test("the hex field applies a typed colour to the selection", () => {
    const editor = renderToolbar([["textColor"]]);
    click('[data-test-id="tool-chevronDown"]');
    click('[data-test-id="color-picker-palette"]');

    const hex = document.querySelector<HTMLInputElement>(
      'input[data-test-id="color-picker-hex"]'
    );
    if (!hex) throw new Error("the hex colour field is not rendered");
    type(hex, "#ff0000");

    expect(editor.getHTML()).toContain("#ff0000");
  });
});

describe("list tool on the web kit", () => {
  test("the bullet list button toggles a bullet list on the selection", () => {
    const editor = renderToolbar([["bulletList"]]);
    click('[data-test-id="tool-bulletList"]');

    expect(editor.isActive("bulletList")).toBe(true);
  });
});
