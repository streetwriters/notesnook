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

import { createEditor, h, ul, li } from "../../../../test-utils/index.js";
import { test, expect } from "vitest";
import { TaskListNode } from "../index.js";
import { TaskItemNode } from "../../task-item/index.js";
import { p, eq } from "prosemirror-test-builder";
import { countCheckedItems, deleteCheckedItems, sortList } from "../utils.js";

function taskList(...children: HTMLLIElement[]) {
  return ul(children, { class: "checklist" });
}

function taskItem(
  text: string,
  attr: { checked?: boolean } = {},
  subList?: HTMLUListElement
) {
  const children: HTMLElement[] = [h("p", [text])];
  if (subList) children.push(subList);

  return li(children, {
    class: "checklist--item " + (attr.checked ? "checked" : "")
  });
}

const NESTED_TASK_LIST = taskList(
  taskItem("Task item 1", { checked: true }),
  taskItem("Task item 2"),
  taskItem(
    "Task item 3",
    { checked: false },
    taskList(
      taskItem("Task item 4", { checked: true }),
      taskItem("Task item 5"),
      taskItem(
        "Task item 6",
        { checked: false },
        taskList(
          taskItem("Task item 7", { checked: true }),
          taskItem("Task item 8", { checked: true }),
          taskItem(
            "Task item 9",
            { checked: false },
            taskList(
              taskItem("Task item 10", { checked: true }),
              taskItem("Task item 11", { checked: true }),
              taskItem("Task item 12")
            )
          )
        )
      )
    )
  )
).outerHTML;

test(`count items in a task list`, async () => {
  const {
    builder: { taskItem, taskList }
  } = createEditor({
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  const taskListNode = taskList(
    taskItem({ checked: true }, p("Task item 1")),
    taskItem({ checked: false }, p("Task item 2")),
    taskItem(
      { checked: false },
      p("Task item 3"),
      taskList(taskItem({ checked: true }, p("Task item 4")))
    )
  );

  const { checked, total } = countCheckedItems(taskListNode);
  expect(checked).toBe(2);
  expect(total).toBe(4);
});

test(`delete checked items in a task list`, async () => {
  const { editor } = createEditor({
    initialContent: taskList(
      taskItem("Task item 1", { checked: true }),
      taskItem("Task item 2")
    ).outerHTML,
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  editor.commands.command(({ tr }) => !!deleteCheckedItems(tr, 0));

  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});

test(`delete checked items in a nested task list`, async () => {
  const { editor } = createEditor({
    initialContent: NESTED_TASK_LIST,
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  let { tr } = editor.state;
  tr = deleteCheckedItems(tr, 0) || tr;
  editor.view.dispatch(tr);

  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});

test(`delete checked items in a task list with no checked items should do nothing`, async () => {
  const { editor } = createEditor({
    initialContent: taskList(
      taskItem("Task item 1", { checked: false }),
      taskItem("Task item 2"),
      taskItem(
        "Task item 3",
        { checked: false },
        taskList(
          taskItem("Task item 4", { checked: false }),
          taskItem("Task item 5"),
          taskItem("Task item 6", { checked: false })
        )
      )
    ).outerHTML,
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  const beforeDoc = editor.state.doc.copy(editor.state.doc.content);
  editor.commands.command(({ tr }) => !!deleteCheckedItems(tr, 0));

  expect(eq(editor.state.doc, beforeDoc)).toBe(true);
});

test(`sort checked items to the bottom of the task list`, async () => {
  const { editor } = createEditor({
    initialContent: NESTED_TASK_LIST,
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  editor.commands.command(({ tr }) => !!sortList(tr, 0));

  expect(editor.state.doc.content.toJSON()).toMatchSnapshot();
});

test(`sorting a task list with no checked items should do nothing`, async () => {
  const { editor } = createEditor({
    initialContent: taskList(taskItem("Task item 1"), taskItem("Task item 2"))
      .outerHTML,
    extensions: {
      taskItem: TaskItemNode.configure({ nested: true }),
      taskList: TaskListNode
    }
  });

  const beforeDoc = editor.state.doc.copy(editor.state.doc.content);
  editor.commands.command(({ tr }) => !!sortList(tr, 0));

  expect(eq(editor.state.doc, beforeDoc)).toBe(true);
});
