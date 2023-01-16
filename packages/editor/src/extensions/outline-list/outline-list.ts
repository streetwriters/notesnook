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
import { createNodeView } from "../react";
import { OutlineListComponent } from "./component";

export type OutlineListAttributes = {
  collapsed: boolean;
};

export interface OutlineListOptions {
  HTMLAttributes: Record<string, unknown>;
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
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      collapsed: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => element.dataset.collapsed === "true",
        renderHTML: (attributes) => ({
          "data-collapsed": attributes.collapsed === true
        })
      }
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
        ({ commands }) => {
          return commands.toggleList(this.name, outlineListItemName);
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
        type: this.type
      })
    ];
  },

  addNodeView() {
    return createNodeView(OutlineListComponent, {
      contentDOMFactory: () => {
        const content = document.createElement("ul");
        content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
        content.style.whiteSpace = "inherit";
        return { dom: content };
      }
    });
  }
});
