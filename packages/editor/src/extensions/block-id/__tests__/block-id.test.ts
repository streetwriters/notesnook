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

import { test, expect } from "vitest";
import { createEditor, h } from "../../../../test-utils";
import { Heading } from "../../heading";
import { BlockId } from "../block-id";

test("splitting a node with blockId should generate new blockId for the new node", async () => {
  const el = h("div", [
    h("h1", ["A heading one"], { "data-block-id": "blockid" })
  ]);
  const { editor } = createEditor({
    extensions: {
      heading: Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      blockId: BlockId
    },
    initialContent: el.outerHTML
  });

  editor.commands.setTextSelection(9);
  const event = new KeyboardEvent("keydown", { key: "Enter" });
  editor.view.dom.dispatchEvent(event);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const headings = editor.getJSON().content;
  expect(headings?.[0].attrs?.blockId).toBe("blockid");
  expect(headings?.[1].attrs?.blockId).not.toBeUndefined();
  expect(headings?.[1].attrs?.blockId).not.toBe("blockid");
});
