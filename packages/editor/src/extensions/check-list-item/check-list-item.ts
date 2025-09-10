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
import { KeyboardShortcutCommand, mergeAttributes, Node } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

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
        priority: 51
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
      const listItem = document.createElement("li");
      const checkboxWrapper = document.createElement("div");
      const content = document.createElement("div");

      checkboxWrapper.contentEditable = "false";
      checkboxWrapper.className = "checkbox-wrapper";
      checkboxWrapper.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
        </svg>
      `;

      content.className = "checklist-item-content";

      checkboxWrapper.addEventListener("mousedown", (event) => {
        if (globalThis.keyboardShown) {
          event.preventDefault();
        }
      });

      checkboxWrapper.addEventListener("click", (event) => {
        event.preventDefault();

        const isChecked = checkboxWrapper.classList.contains("checked");

        // if the editor isn't editable and we don't have a handler for
        // readonly checks we have to undo the latest change
        if (!editor.isEditable && !this.options.onReadOnlyChecked) {
          return;
        }

        if (editor.isEditable && typeof getPos === "function") {
          editor
            .chain()
            .command(({ tr }) => {
              const position = getPos();
              const currentNode = tr.doc.nodeAt(position);

              tr.setNodeMarkup(position, undefined, {
                ...currentNode?.attrs,
                checked: !isChecked
              });

              return true;
            })
            .run();
        }
        if (!editor.isEditable && this.options.onReadOnlyChecked) {
          // Reset state if onReadOnlyChecked returns false
          if (!this.options.onReadOnlyChecked(node, !isChecked)) {
            return;
          }
        }
      });

      if (node.attrs.checked) {
        checkboxWrapper.classList.add("checked");
        listItem.dataset.checked = node.attrs.checked;
      }

      listItem.append(checkboxWrapper, content);

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          listItem.dataset.checked = updatedNode.attrs.checked;
          if (updatedNode.attrs.checked) {
            checkboxWrapper.classList.add("checked");
          } else {
            checkboxWrapper.classList.remove("checked");
          }

          return true;
        }
      };
    };
  }

  // addInputRules() {
  //   return [
  //     wrappingInputRule({
  //       find: inputRegex,
  //       type: this.type,
  //       getAttributes: (match) => ({
  //         checked: match[match.length - 1] === "x"
  //       })
  //     })
  //   ];
  // }
});
