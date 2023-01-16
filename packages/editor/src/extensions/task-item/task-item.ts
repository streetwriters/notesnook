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

import { mergeAttributes } from "@tiptap/core";
import { onArrowUpPressed, onBackspacePressed } from "../list-item/commands";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskItemComponent } from "./component";
import { createNodeView } from "../react";

export type TaskItemAttributes = {
  checked: boolean;
};

export const TaskItemNode = TaskItem.extend({
  draggable: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.classList.contains("checked"),
        renderHTML: (attributes) => ({
          class: attributes.checked ? "checked" : ""
        })
      }
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "checklist--item"
      }),
      0
    ];
  },

  parseHTML() {
    return [
      {
        tag: "li",
        getAttrs: (node) => {
          if (node instanceof Node && node instanceof HTMLElement) {
            return node.classList.contains("checklist--item") ||
              node.parentElement?.classList.contains("checklist")
              ? null
              : false;
          }
          return false;
        },
        priority: 51
      }
    ];
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Backspace: ({ editor }) =>
        onBackspacePressed(editor, this.name, this.type),
      ArrowUp: ({ editor }) => onArrowUpPressed(editor, this.name, this.type)
    };
  },

  addNodeView() {
    return createNodeView(TaskItemComponent, {
      contentDOMFactory: true,
      wrapperFactory: () => document.createElement("li"),
      shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
        return prev.checked !== next.checked;
      }
    });
  }
});
