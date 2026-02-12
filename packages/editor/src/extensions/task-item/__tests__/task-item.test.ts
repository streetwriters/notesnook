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
  taskList,
  taskItem
} from "../../../../test-utils/index.js";
import { TaskListNode } from "../../task-list/task-list.js";
import { TaskItemNode } from "../task-item.js";
import { Paragraph } from "../../paragraph/paragraph.js";
import { ImageNode } from "../../image/image.js";

describe("task list item", () => {
  /**
   * see https://github.com/streetwriters/notesnook/pull/8877 for more context
   */
  test("inline image as first child in task list item", async () => {
    const el = taskList(
      taskItem([p(["item 1"])]),
      taskItem([h("img", [], { src: "image.png" })])
    );

    const { editor } = createEditor({
      initialContent: el.outerHTML,
      extensions: {
        taskList: TaskListNode,
        taskListItem: TaskItemNode.configure({ nested: true }),
        paragraph: Paragraph,
        image: ImageNode
      }
    });

    expect(editor.getHTML()).toMatchSnapshot();
  });
});
