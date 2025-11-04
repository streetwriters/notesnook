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

import { describe, expect, test } from "vitest";
import {
  createEditor,
  h,
  p,
  checkList,
  checkListItem
} from "../../../../test-utils/index.js";
import { CheckList } from "../../check-list/check-list.js";
import { CheckListItem } from "../check-list-item.js";
import { Paragraph } from "../../paragraph/paragraph.js";
import { ImageNode } from "../../image/image.js";

describe("check list item", () => {
  /**
   * see https://github.com/streetwriters/notesnook/pull/8877 for more context
   */
  test("inline image as first child in check list item", async () => {
    const el = checkList(
      checkListItem([p(["item 1"])]),
      checkListItem([h("img", [], { src: "image.png" })])
    );

    const { editor } = createEditor({
      initialContent: el.outerHTML,
      extensions: {
        checkList: CheckList,
        checkListItem: CheckListItem.configure({ nested: true }),
        paragraph: Paragraph,
        image: ImageNode
      }
    });

    expect(editor.getHTML()).toMatchSnapshot();
  });
});
