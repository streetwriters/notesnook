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
import { ImageNode } from "../index.js";
import { OutlineList } from "../../outline-list/outline-list.js";
import { OutlineListItem } from "../../outline-list-item/outline-list-item.js";

describe("migration", () => {
  test(`inline image in paragraph`, async () => {
    const el = p(["hello", h("img", [], { src: "image.png" }), "world"]);
    const {
      builder: { image },
      editor
    } = createEditor({
      initialContent: el.outerHTML,
      extensions: {
        image: ImageNode.configure({})
      }
    });

    expect(editor.getJSON()).toMatchSnapshot();
  });

  test(`inline image in outline list`, async () => {
    const el = outlineList(
      outlineListItem(["item 1"]),
      outlineListItem(
        ["hello", h("img", [], { src: "image.png" }), "world"],
        outlineList(
          outlineListItem(["sub item 2"]),
          outlineListItem(["sub item 3"])
        )
      ),
      outlineListItem(["item 4"])
    );

    const {
      builder: { image },
      editor
    } = createEditor({
      initialContent: el.outerHTML,
      extensions: {
        outlineList: OutlineList,
        outlineListItem: OutlineListItem,
        image: ImageNode
      }
    });

    expect(editor.getJSON()).toMatchSnapshot();
  });
});
