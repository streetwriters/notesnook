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

import { getParentAttributes } from "../../utils/prosemirror.js";
import { Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";

export type OutlineListAttributes = {
  collapsed: boolean;
};

export interface OutlineListOptions {
  HTMLAttributes: Record<string, unknown>;
  keepMarks: boolean;
  keepAttributes: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    outlineList: {
      /**
       * Toggle a bullet list
       */
      toggleOutlineList: () => ReturnType;
    };
  }
}

const inputRegex = /^\s*(-o)\s$/;
const outlineListItemName = "outlineListItem";
export const OutlineList = Node.create<OutlineListOptions>({
  name: "outlineList",

  addOptions() {
    return {
      HTMLAttributes: {},
      keepMarks: false,
      keepAttributes: false
    };
  },

  group: "block list",

  content: `${outlineListItemName}+`,

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 52
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name
      }),
      0
    ];
  },

  addCommands() {
    return {
      toggleOutlineList:
        () =>
        ({ chain }) => {
          return chain()
            .toggleList(
              this.name,
              outlineListItemName,
              this.options.keepMarks,
              getParentAttributes(
                this.editor,
                this.options.keepMarks,
                this.options.keepAttributes
              )
            )
            .run();
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-O": () => this.editor.commands.toggleOutlineList()
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        keepMarks: this.options.keepMarks,
        keepAttributes: this.options.keepAttributes,
        editor: this.editor,
        getAttributes: () => {
          return getParentAttributes(
            this.editor,
            this.options.keepMarks,
            this.options.keepAttributes
          );
        }
      })
    ];
  },
  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const ul = document.createElement("ul");
      ul.classList.add("outline-list");
      if (node.attrs.textDirection) ul.dir = node.attrs.textDirection;
      for (const key in HTMLAttributes)
        ul.setAttribute(key, HTMLAttributes[key]);
      return {
        dom: ul,
        contentDOM: ul
      };
    };
  }
});
