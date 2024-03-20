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
import { TaskListHeader } from "./task-list-header";
import { TaskListItems } from "./task-list-items";
import { DOMParser } from "@tiptap/pm/model";

export const TaskList = Node.create({
  name: "taskList",
  content: `${TaskListHeader.name} ${TaskListItems.name}`,
  group: "block",
  defining: true,

  addAttributes() {
    return {
      editable: {
        default: true,
        keepOnSplit: false,
        parseHTML: (element) => element.contentEditable !== "true",
        renderHTML: (attributes) => {
          if (attributes.editable) {
            return {};
          }
          return {
            contenteditable: "false"
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.taskList"
      },
      {
        // Migration from old task list schema to new schema
        tag: "ul.checklist",
        getAttrs(node) {
          // we don't want to convert/migrate nested task lists
          if (
            node instanceof HTMLUListElement &&
            node.parentElement instanceof HTMLLIElement
          )
            return false;
          return null;
        },
        getContent: (node, schema) => {
          const taskListItems = node as HTMLUListElement;
          const title = taskListItems.dataset.title;
          const readonly = !!taskListItems.dataset.readonly;

          const parser = DOMParser.fromSchema(schema);

          const wrapper = document.createElement("div");
          const taskList = document.createElement("div");
          const header = document.createElement("h1");
          header.innerText = title ?? "";
          taskListItems.classList.remove("checklist");
          taskListItems.classList.add("taskList");
          taskList.classList.add("taskList");
          if (readonly) taskList.contentEditable = "false";
          taskList.appendChild(header);
          taskList.appendChild(taskListItems);
          wrapper.appendChild(taskList);

          const parsedTaskList = parser.parse(wrapper).content.firstChild;
          if (!parsedTaskList)
            throw new Error("Failed to migrate from old task list.");

          return parsedTaskList.content;
        },
        priority: 60
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "taskList"
      }),
      0
    ];
  }
});
