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

import { createEditor, h } from "@/test-utils";
import { test, expect } from "vitest";
import BulletList from "../../bullet-list";
import { ListItem } from "../../list-item";
import { joinUpWithLastListItem } from "../key-map";

test(`join up with last list item in a flat list`, async () => {
  const { editor } = createEditor({
    initialContent: h("div", [
      h("ul", [h("li", ["Hello"]), h("li", ["World"])]),
      h("p")
    ]).innerHTML,
    extensions: {
      bulletList: BulletList,
      listItem: ListItem
    }
  });

  editor.commands.setTextSelection(editor.state.doc.nodeSize - 2);
  joinUpWithLastListItem(editor);

  expect(editor.state.selection.$from.parent.textContent).toBe("World");
  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});

test(`join up with last list item in a nested list`, async () => {
  const { editor } = createEditor({
    initialContent: h("div", [
      h("ul", [
        h("li", ["Hello"]),
        h("li", [
          "World",
          h("ul", [
            h("li", ["Hello"]),
            h("li", ["World", h("ul", [h("li", ["Hello"])])]),
            h("li", ["A very nested world"])
          ])
        ])
      ]),
      h("p")
    ]).innerHTML,
    extensions: {
      bulletList: BulletList,
      listItem: ListItem
    }
  });

  editor.commands.setTextSelection(editor.state.doc.nodeSize - 2);
  joinUpWithLastListItem(editor);

  expect(editor.state.selection.$from.parent.textContent).toBe(
    "A very nested world"
  );
  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});

test(`join up with last list item in a nested list`, async () => {
  const { editor } = createEditor({
    initialContent: h("div", [
      h("ul", [
        h("li", ["Hello"]),
        h("li", [
          "World",
          h("ul", [
            h("li", ["Hello"]),
            h("li", ["World", h("ul", [h("li", ["Hello"])])]),
            h("li", ["A very nested world"])
          ])
        ])
      ]),
      h("p")
    ]).innerHTML,
    extensions: {
      bulletList: BulletList,
      listItem: ListItem
    }
  });

  editor.commands.setTextSelection(editor.state.doc.nodeSize - 2);
  joinUpWithLastListItem(editor);

  expect(editor.state.selection.$from.parent.textContent).toBe(
    "A very nested world"
  );
  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});
