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

import "@/tests.setup";
import tap from "tap";
import expect from "expect";
import { Editor, AnyExtension, Extensions } from "@tiptap/core";
import { TaskListNode } from "../index";
import { TaskItemNode } from "../../task-item";
import StarterKit from "@tiptap/starter-kit";
import { builders, doc, NodeBuilder, p, eq } from "prosemirror-test-builder";
import { Node, Schema } from "@tiptap/pm/model";
import { countCheckedItems, deleteCheckedItems, sortList } from "../utils";
import { EditorState } from "@tiptap/pm/state";

type Builder<TNodes extends string> = {
  scheme: Schema;
} & Record<TNodes, NodeBuilder>;

type EditorOptions<TNodes extends string> = {
  extensions: Record<TNodes, AnyExtension>;
  initialDoc?: (builder: Builder<TNodes>) => Node;
};

function createEditor<TNodes extends string>(options: EditorOptions<TNodes>) {
  const { extensions, initialDoc } = options;
  const editor = new Editor({
    extensions: [StarterKit, ...(Object.values(extensions) as Extensions)]
  });

  const builder = builders(editor.schema) as unknown as Builder<TNodes>;

  if (initialDoc) {
    const doc = initialDoc(builder);
    editor.view.updateState(
      EditorState.create({
        schema: editor.view.state.schema,
        doc,
        plugins: editor.state.plugins
      })
    );

    return { editor, builder, initialDoc: doc };
  }

  return { editor, builder, initialDoc: editor.state.doc };
}

tap.test(`count items in a task list`, async () => {
  const {
    builder: { taskItem, taskList }
  } = createEditor({
    extensions: {
      taskItem: TaskItemNode,
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

tap.test(`delete checked items in a task list`, async (t) => {
  const { editor } = createEditor({
    initialDoc: ({ taskItem, taskList }) =>
      doc(
        taskList(
          taskItem({ checked: true }, p("Task item 1")),
          taskItem({ checked: false }, p("Task item 2"))
        )
      ),
    extensions: {
      taskItem: TaskItemNode,
      taskList: TaskListNode
    }
  });

  let { tr } = editor.state;
  tr = deleteCheckedItems(tr, 0) || tr;
  editor.view.dispatch(tr);

  t.matchSnapshot(editor.state.doc.content.toJSON());
});

tap.test(`delete checked items in a nested task list`, async (t) => {
  const { editor } = createEditor({
    initialDoc: ({ taskItem, taskList }) =>
      doc(
        taskList(
          taskItem({ checked: true }, p("Task item 1")),
          taskItem({ checked: false }, p("Task item 2")),
          taskItem(
            { checked: false },
            p("Task item 3"),
            taskList(
              taskItem({ checked: true }, p("Task item 4")),
              taskItem({ checked: false }, p("Task item 5")),
              taskItem({ checked: false }, p("Task item 6")),
              taskItem(
                { checked: true },
                p("Task item 7"),
                taskList(
                  taskItem({ checked: true }, p("Task item 8")),
                  taskItem({ checked: true }, p("Task item 9")),
                  taskItem({ checked: false }, p("Task item 10")),
                  taskItem({ checked: true }, p("Task item 11"))
                )
              )
            )
          )
        )
      ),
    extensions: {
      taskItem: TaskItemNode,
      taskList: TaskListNode
    }
  });

  let { tr } = editor.state;
  tr = deleteCheckedItems(tr, 0) || tr;
  editor.view.dispatch(tr);

  t.matchSnapshot(editor.state.doc.content.toJSON());
});

tap.test(
  `delete checked items in a task list with no checked items should do nothing`,
  async () => {
    const { editor, initialDoc } = createEditor({
      initialDoc: ({ taskItem, taskList }) =>
        doc(
          taskList(
            taskItem({ checked: false }, p("Task item 2")),
            taskItem(
              { checked: false },
              p("Task item 3"),
              taskList(
                taskItem({ checked: false }, p("Task item 5")),
                taskItem({ checked: false }, p("Task item 6")),
                taskItem(
                  { checked: false },
                  p("Task item 7"),
                  taskList(taskItem({ checked: false }, p("Task item 10")))
                )
              )
            )
          )
        ),
      extensions: {
        taskItem: TaskItemNode,
        taskList: TaskListNode
      }
    });

    editor.commands.command(({ tr }) => !!deleteCheckedItems(tr, 0));

    expect(eq(editor.state.doc, initialDoc)).toBe(true);
  }
);

tap.test(`sort checked items to the bottom of the task list`, async (t) => {
  const { editor } = createEditor({
    initialDoc: ({ taskItem, taskList }) =>
      doc(
        taskList(
          taskItem({ checked: true }, p("Task item 1")),
          taskItem({ checked: false }, p("Task item 2")),
          taskItem(
            { checked: false },
            p("Task item 3"),
            taskList(
              taskItem({ checked: true }, p("Task item 4")),
              taskItem({ checked: true }, p("Task item 5")),
              taskItem({ checked: false }, p("Task item 6")),
              taskItem(
                { checked: false },
                p("Task item 7"),
                taskList(
                  taskItem({ checked: true }, p("Task item 8")),
                  taskItem({ checked: true }, p("Task item 9")),
                  taskItem({ checked: false }, p("Task item 10")),
                  taskItem({ checked: true }, p("Task item 11"))
                )
              )
            )
          )
        )
      ),
    extensions: {
      taskItem: TaskItemNode,
      taskList: TaskListNode
    }
  });

  editor.commands.command(({ tr }) => !!sortList(tr, 0));

  t.matchSnapshot(editor.state.doc.content.toJSON());
});

tap.test(
  `sorting a task list with no checked items should do nothing`,
  async () => {
    const { editor, initialDoc } = createEditor({
      initialDoc: ({ taskItem, taskList }) =>
        doc(
          taskList(
            taskItem({ checked: false }, p("Task item 1")),
            taskItem({ checked: false }, p("Task item 2"))
          )
        ),
      extensions: {
        taskItem: TaskItemNode,
        taskList: TaskListNode
      }
    });

    editor.commands.command(({ tr }) => !!sortList(tr, 0));
    expect(eq(editor.state.doc, initialDoc)).toBe(true);
  }
);
