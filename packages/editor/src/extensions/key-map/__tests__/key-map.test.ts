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

import {
  createEditor,
  h,
  p,
  outlineList,
  outlineListItem
} from "../../../../test-utils/index.js";
import { test, expect, describe } from "vitest";
import { KeyMap } from "../key-map.js";
import { OutlineList } from "../../outline-list/outline-list.js";
import { OutlineListItem } from "../../outline-list-item/outline-list-item.js";

describe("key-map", () => {
  test("move paragraph up", async () => {
    const el = h("div", [p(["para 1"]), p(["para 2"]), p(["para 3"])]);
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      initialContent: el.outerHTML,
      extensions: {
        KeyMap: KeyMap
      }
    });

    editor.commands.setTextSelection({ from: 10, to: 10 });
    const event = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      altKey: true
    });
    editor.view.dom.dispatchEvent(event);

    expect(editor.getHTML()).toBe(`<p>para 2</p><p>para 1</p><p>para 3</p>`);
  });

  test("move paragraph down", async () => {
    const el = h("div", [p(["para 1"]), p(["para 2"]), p(["para 3"])]);
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      initialContent: el.outerHTML,
      extensions: {
        KeyMap: KeyMap
      }
    });

    editor.commands.setTextSelection(0);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      altKey: true
    });
    editor.view.dom.dispatchEvent(event);

    expect(editor.getHTML()).toBe(`<p>para 2</p><p>para 1</p><p>para 3</p>`);
  });

  test("move outline list item up", async () => {
    const el = outlineList(
      outlineListItem(["item 1"]),
      outlineListItem(["item 2"]),
      outlineListItem(["item 3"])
    );
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      initialContent: el.outerHTML,
      extensions: {
        KeyMap: KeyMap,
        outlineList: OutlineList,
        outlineListItem: OutlineListItem
      }
    });

    editor.commands.setTextSelection({ from: 15, to: 15 });
    const event = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      altKey: true
    });
    editor.view.dom.dispatchEvent(event);

    const expectedHTML = outlineList(
      outlineListItem(["item 2"]),
      outlineListItem(["item 1"]),
      outlineListItem(["item 3"])
    ).outerHTML;
    expect(editor.getHTML()).toBe(expectedHTML);
  });

  test("move outline list item down", async () => {
    const el = outlineList(
      outlineListItem(["item 1"]),
      outlineListItem(["item 2"]),
      outlineListItem(["item 3"])
    );
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      initialContent: el.outerHTML,
      extensions: {
        KeyMap: KeyMap,
        outlineList: OutlineList,
        outlineListItem: OutlineListItem
      }
    });

    editor.commands.setTextSelection(0);
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      altKey: true
    });
    editor.view.dom.dispatchEvent(event);

    const expectedHTML = outlineList(
      outlineListItem(["item 2"]),
      outlineListItem(["item 1"]),
      outlineListItem(["item 3"])
    ).outerHTML;
    expect(editor.getHTML()).toBe(expectedHTML);
  });
});
