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

import { Node, mergeAttributes } from "@tiptap/core";
import { createNodeView } from "../react";
import { TaskListHeaderComponent } from "./task-list-header-component";

export type TaskListStats = { checked: number; total: number };
export type TaskListHeaderAttributes = {
  stats: TaskListStats;
};
export const TaskListHeader = Node.create({
  name: "taskListHeader",
  content: "paragraph",
  group: "block",
  defining: true,

  addAttributes() {
    return {
      stats: {
        default: { checked: 0, total: 0 },
        rendered: false
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "h1",
        priority: 51,
        context: `taskList/`
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["h1", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return createNodeView(TaskListHeaderComponent, {
      contentDOMFactory: true
    });
  }
});
