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

import { Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import TextStyle from "@tiptap/extension-text-style";

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

export const inputRegex = /^\s*(-o)\s$/;
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
        ({ commands, chain }) => {
          if (this.options.keepAttributes) {
            return chain()
              .toggleList(
                this.name,
                outlineListItemName,
                this.options.keepMarks
              )
              .updateAttributes(
                outlineListItemName,
                this.editor.getAttributes(TextStyle.name)
              )
              .run();
          }

          return commands.toggleList(
            this.name,
            outlineListItemName,
            this.options.keepMarks
          );
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-O": () => this.editor.commands.toggleOutlineList()
    };
  },

  addInputRules() {
    let inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type
    });

    if (this.options.keepMarks || this.options.keepAttributes) {
      inputRule = wrappingInputRule({
        find: inputRegex,
        type: this.type,
        keepMarks: this.options.keepMarks,
        keepAttributes: this.options.keepAttributes,
        getAttributes: () => {
          return this.editor.getAttributes(TextStyle.name);
        },
        editor: this.editor
      });
    }

    return [inputRule];
  },

  addNodeView() {
    return ({ HTMLAttributes, node }) => {
      const ul = document.createElement("ul");
      ul.classList.add("outline-list");
      console.log("textDecoration", node.attrs.textDirection);
      if (HTMLAttributes.dir) ul.dir = HTMLAttributes.dir;
      else if (node.attrs.textDirection) ul.dir = HTMLAttributes.dir;
      return {
        dom: ul,
        contentDOM: ul
      };
    };
  }
});
