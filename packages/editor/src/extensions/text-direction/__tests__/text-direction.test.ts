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
import { createEditor } from "../../../../test-utils/index.js";
import { TaskListNode } from "../../task-list/task-list.js";
import { TaskItemNode } from "../../task-item/task-item.js";
import { BulletList } from "../../bullet-list/bullet-list.js";
import { ListItem } from "../../list-item/list-item.js";
import { Paragraph } from "../../paragraph/paragraph.js";
import { TextDirection } from "../text-direction.js";

function directions(editor: {
  state: { doc: { descendants: (fn: (node: any) => void) => void } };
}) {
  const found: Record<string, string[]> = {};
  editor.state.doc.descendants((node) => {
    const dir = node.attrs.textDirection;
    if (dir !== undefined) (found[node.type.name] ??= []).push(dir);
  });
  return found;
}

/** cursor into the first paragraph of the document */
function cursorInFirstParagraph(editor: any) {
  let pos = -1;
  editor.state.doc.descendants((node: any, at: number) => {
    if (pos === -1 && node.type.name === "paragraph") pos = at + 1;
  });
  editor.commands.setTextSelection(pos);
}

describe("text direction on lists", () => {
  const cases = [
    {
      name: "task list",
      extensions: {
        taskList: TaskListNode,
        taskListItem: TaskItemNode.configure({ nested: true }),
        paragraph: Paragraph
      },
      content: `<ul class="checklist" dir="rtl"><li class="checklist--item"><p dir="rtl">one</p></li><li class="checklist--item"><p dir="rtl">two</p></li></ul>`
    },
    {
      name: "bullet list",
      extensions: {
        bulletList: BulletList,
        listItem: ListItem,
        paragraph: Paragraph
      },
      content: `<ul dir="rtl"><li><p dir="rtl">one</p></li><li><p dir="rtl">two</p></li></ul>`
    }
  ];

  for (const { name, extensions, content } of cases) {
    test(`switching a ${name} to ltr clears the direction of every item`, () => {
      const { editor } = createEditor({
        initialContent: content,
        extensions: {
          ...extensions,
          textDirection: TextDirection.configure({
            types: ["paragraph", "taskList", "bulletList"]
          })
        }
      });

      // every paragraph starts rtl, matching the list
      const before = directions(editor);
      expect(Object.values(before).flat()).toContain("rtl");

      cursorInFirstParagraph(editor);
      editor.commands.setTextDirection(undefined);

      // ...and nothing is left rtl — not the list, not any item, cursor or
      // not, so the checkboxes/markers and the text no longer disagree
      const after = directions(editor);
      expect(Object.values(after).flat()).not.toContain("rtl");
    });
  }
});
