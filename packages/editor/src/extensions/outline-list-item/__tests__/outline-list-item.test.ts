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
  li,
  outlineList,
  outlineListItem
} from "../../../../test-utils/index.js";
import { test, expect, describe, beforeAll, vi } from "vitest";
import { OutlineList } from "../../outline-list/outline-list.js";
import { OutlineListItem } from "../outline-list-item.js";
import { CodeBlock } from "../../code-block/code-block.js";

describe("outline list item", () => {
  beforeAll(() => {
    vi.mock("nanoid", () => ({
      nanoid: () => "test-id-123456"
    }));
  });

  test(`code block in outline list item`, async () => {
    const subList = outlineList(
      outlineListItem(["sub item 2"]),
      outlineListItem(["sub item 3"])
    );
    const listItemWithCodeBlock = li(
      [
        h("p", ["hello"]),
        h("pre", [h("code", ["const x = 1;"])]),
        h("p", ["world"]),
        subList
      ],
      { "data-type": "outlineListItem" }
    );
    const el = outlineList(
      outlineListItem(["item 1"]),
      listItemWithCodeBlock,
      outlineListItem(["item 4"])
    );

    const {
      builder: { codeBlock },
      editor
    } = createEditor({
      initialContent: el.outerHTML,
      extensions: {
        outlineList: OutlineList,
        outlineListItem: OutlineListItem,
        codeBlock: CodeBlock
      }
    });

    expect(editor.getJSON()).toMatchSnapshot();
  });
});
