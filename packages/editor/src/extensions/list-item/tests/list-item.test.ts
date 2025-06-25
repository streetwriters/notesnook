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

import ListKeymap from "@tiptap/extension-list-keymap";
import { expect, test } from "vitest";
import { createEditor, h, li, p, ul } from "../../../../test-utils/index.js";
import BulletList from "../../bullet-list/index.js";
import OrderedList from "../../ordered-list/index.js";
import { ListItem } from "../index.js";

test("hitting backspace at the start of first list item", async () => {
  const el = ul([li([p(["item1"])]), li([p(["item2"])])]);
  const editorElement = h("div");
  const editor = createEditor({
    element: editorElement,
    initialContent: el.outerHTML,
    extensions: {
      listItem: ListItem,
      listKeymap: ListKeymap.configure({
        listTypes: [
          {
            itemName: ListItem.name,
            wrapperNames: [BulletList.name, OrderedList.name]
          }
        ]
      })
    }
  });
  const event = new KeyboardEvent("keydown", { key: "Backspace" });
  editor.editor.view.dom.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("hitting backspace at the start of the second (or next) list item", async () => {
  const el = ul([li([p(["item1"])]), li([p(["item2"])])]);
  const editorElement = h("div");
  const editor = createEditor({
    element: editorElement,
    initialContent: el.outerHTML,
    extensions: {
      listItem: ListItem,
      listKeymap: ListKeymap.configure({
        listTypes: [
          {
            itemName: ListItem.name,
            wrapperNames: [BulletList.name, OrderedList.name]
          }
        ]
      })
    }
  });
  editor.editor.commands.setTextSelection(12);
  const event = new KeyboardEvent("keydown", { key: "Backspace" });
  editor.editor.view.dom.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(editorElement.outerHTML).toMatchSnapshot();
});

test("hitting backspace at the start of the second (or next) paragraph inside the list item", async () => {
  const el = ul([li([p(["item 1"]), p(["item 2"])])]).outerHTML;
  const editorElement = h("div");
  const editor = createEditor({
    element: editorElement,
    initialContent: el,
    extensions: {
      listItem: ListItem,
      listKeymap: ListKeymap.configure({
        listTypes: [
          {
            itemName: ListItem.name,
            wrapperNames: [BulletList.name, OrderedList.name]
          }
        ]
      })
    }
  });
  editor.editor.commands.setTextSelection(11);
  const event = new KeyboardEvent("keydown", { key: "Backspace" });
  editor.editor.view.dom.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(editorElement.outerHTML).toMatchSnapshot();
});
