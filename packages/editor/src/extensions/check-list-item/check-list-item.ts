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
import { keybindings } from "@notesnook/common";
import {
  findParentNodeClosestToPos,
  KeyboardShortcutCommand,
  mergeAttributes,
  Node
} from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CheckList } from "../check-list/check-list.js";
import { ensureLeadingParagraph } from "../../utils/prosemirror.js";

export interface CheckListItemOptions {
  onReadOnlyChecked?: (node: ProseMirrorNode, checked: boolean) => boolean;
  nested: boolean;
  HTMLAttributes: Record<string, any>;
}

// export const inputRegex = /^\s*(\[([( |x])?\])\s$/;

export const CheckListItem = Node.create<CheckListItemOptions>({
  name: "checkListItem",

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {}
    };
  },

  content() {
    return this.options.nested ? "paragraph block*" : "paragraph+";
  },

  defining: true,

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

  parseHTML() {
    return [
      {
        tag: `li.simple-checklist--item`,
        priority: 51,
        getContent: ensureLeadingParagraph
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "simple-checklist--item"
      }),
      0
    ];
  },

  addKeyboardShortcuts() {
    const shortcuts: {
      [key: string]: KeyboardShortcutCommand;
    } = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      [keybindings.liftListItem.keys]: () =>
        this.editor.commands.liftListItem(this.name)
    };

    if (!this.options.nested) {
      return shortcuts;
    }

    return {
      ...shortcuts,
      Tab: () => this.editor.commands.sinkListItem(this.name)
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const li = document.createElement("li");
      if (node.attrs.checked) li.classList.add("checked");
      else li.classList.remove("checked");

      function onClick(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
        if (!(e.target instanceof HTMLElement)) return;

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
              "checked",
              !li.classList.contains("checked")
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
          const isNested = updatedNode.lastChild?.type.name === CheckList.name;

          if (updatedNode.attrs.checked) li.classList.add("checked");
          else li.classList.remove("checked");

          return true;
        }
      };
    };
  }
});
