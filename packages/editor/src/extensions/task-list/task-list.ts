/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { mergeAttributes } from "@tiptap/core";
import { TaskList } from "@tiptap/extension-task-list";
import { createNodeView } from "../react";
import { TaskListComponent } from "./component";

export type TaskListAttributes = {
  title: string;
  collapsed: boolean;
};

export const TaskListNode = TaskList.extend({
  addAttributes() {
    return {
      collapsed: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.collapsed === "true",
        renderHTML: (attributes) => ({
          "data-collapsed": attributes.collapsed === true
        })
      },
      title: {
        default: null,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.title,
        renderHTML: (attributes) => {
          if (!attributes.title || attributes.nested) {
            return {};
          }

          return {
            "data-title": attributes.title
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "ul",
        getAttrs: (node) => {
          if (node instanceof Node && node instanceof HTMLElement) {
            return node.classList.contains("checklist") && null;
          }
          return false;
        },
        priority: 51
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "checklist"
      }),
      0
    ];
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ editor, commands, state, tr }) => {
          const { $from, $to } = state.selection;
          commands.toggleList(this.name, this.options.itemTypeName);
          const position = {
            from: tr.mapping.map($from.pos),
            to: tr.mapping.map($to.pos)
          };
          // There is a minor bug in Prosemirror or Tiptap where creating
          // nested node view causes the editor selection to act weird.
          // The solution is to manually force the editor back to the correct
          // position.
          // NOTE: We have to wrap this in setTimeout & use the editor
          // directly or else it won't run.
          setTimeout(() => editor.commands.setTextSelection(position), 0);
          return true;
        }
    };
  },

  addNodeView() {
    return createNodeView(TaskListComponent, {
      contentDOMFactory: () => {
        const content = document.createElement("ul");
        content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
        content.style.whiteSpace = "inherit";
        return { dom: content };
      }
    });
  }
});
