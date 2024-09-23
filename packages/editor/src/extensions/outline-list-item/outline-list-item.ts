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

import {
  Node,
  mergeAttributes,
  findParentNodeClosestToPos
} from "@tiptap/core";
import { findParentNodeOfTypeClosestToPos } from "../../utils/prosemirror.js";
import { OutlineList } from "../outline-list/outline-list.js";

export interface ListItemOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const OutlineListItem = Node.create<ListItemOptions>({
  name: "outlineListItem",

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

  content: "paragraph+ list?",

  defining: true,

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name
      }),
      0
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Space": ({ editor }) => {
        const { selection } = editor.state;
        const { $from, empty } = selection;

        if (!empty) return false;

        const listItem = findParentNodeOfTypeClosestToPos($from, this.type);
        if (!listItem) return false;

        const isCollapsed = listItem.node.attrs.collapsed;

        return editor.commands.command(({ tr }) => {
          tr.setNodeAttribute(listItem.pos, "collapsed", !isCollapsed);
          return true;
        });
      },
      Enter: () => {
        // const subList = findSublist(editor, this.type);
        // if (!subList) return this.editor.commands.splitListItem(this.name);

        // const { isCollapsed, subListPos } = subList;

        // if (isCollapsed) {
        //   return this.editor.commands.toggleOutlineCollapse(subListPos, false);
        // }

        return this.editor.commands.splitListItem(this.name);
      },
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name)
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const isNested = node.lastChild?.type.name === OutlineList.name;

      const li = document.createElement("li");

      if (node.attrs.collapsed) li.classList.add("collapsed");
      else li.classList.remove("collapsed");

      if (isNested) li.classList.add("nested");
      else li.classList.remove("nested");

      function onClick(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!(e.target instanceof HTMLParagraphElement)) return;
        if (!li.classList.contains("nested")) return;

        const pos = typeof getPos === "function" ? getPos() : 0;
        if (typeof pos !== "number") return;
        const resolvedPos = editor.state.doc.resolve(pos);

        const { x, y, right } = li.getBoundingClientRect();

        const clientX =
          e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;

        const clientY =
          e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        const hitArea = { width: 40, height: 40 };

        const isRtl =
          e.target.dir === "rtl" ||
          findParentNodeClosestToPos(
            resolvedPos,
            (node) => !!node.attrs.textDirection
          )?.node.attrs.textDirection === "rtl";

        let xStart = clientX >= x - hitArea.width;
        let xEnd = clientX <= x;
        const yStart = clientY >= y;
        const yEnd = clientY <= y + hitArea.height;

        if (isRtl) {
          xEnd = clientX <= right + hitArea.width;
          xStart = clientX >= right;
        }

        if (xStart && xEnd && yStart && yEnd) {
          e.preventDefault();
          editor.commands.command(({ tr }) => {
            tr.setNodeAttribute(
              pos,
              "collapsed",
              !li.classList.contains("collapsed")
            );
            return true;
          });
        }
      }

      li.onmousedown = onClick;
      li.ontouchstart = onClick;

      return {
        dom: li,
        contentDOM: li,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }
          const isNested =
            updatedNode.lastChild?.type.name === OutlineList.name;

          if (updatedNode.attrs.collapsed) li.classList.add("collapsed");
          else li.classList.remove("collapsed");

          if (isNested) li.classList.add("nested");
          else li.classList.remove("nested");

          return true;
        }
      };
    };
  }
});
