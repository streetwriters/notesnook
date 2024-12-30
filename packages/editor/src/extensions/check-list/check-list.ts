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
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";
import { inputRegex } from "@tiptap/extension-task-item";
import { getParentAttributes } from "../../utils/prosemirror.js";
import { ListItem } from "../list-item/index.js";

export interface CheckListOptions {
  itemTypeName: string;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    checkList: {
      /**
       * Toggle a check list
       */
      toggleCheckList: () => ReturnType;
    };
  }
}

export const CheckList = Node.create<CheckListOptions>({
  name: "checkList",

  addOptions() {
    return {
      itemTypeName: "checkListItem",
      HTMLAttributes: {}
    };
  },

  group: "block list",

  content() {
    return `${this.options.itemTypeName}+`;
  },

  parseHTML() {
    return [
      {
        tag: `ul.simple-checklist`,
        priority: 51
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "simple-checklist"
      }),
      0
    ];
  },

  addCommands() {
    return {
      toggleCheckList:
        () =>
        ({ commands }) => {
          return commands.toggleList(this.name, this.options.itemTypeName);
        }
    };
  },

  addInputRules() {
    const inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
      getAttributes: () => {
        return getParentAttributes(this.editor, true, true);
      }
    });
    const oldHandler = inputRule.handler;
    inputRule.handler = ({ state, range, match, chain, can, commands }) => {
      const $from = state.selection.$from;
      const parentNode = $from.node($from.depth - 1);
      if (parentNode.type.name !== ListItem.name) {
        return;
      }

      const tr = state.tr;
      // reset nodes before converting them to a check list.
      commands.clearNodes();

      oldHandler({
        state,
        range: {
          from: tr.mapping.map(range.from),
          to: tr.mapping.map(range.to)
        },
        match,
        chain,
        can,
        commands
      });

      tr.setNodeMarkup(state.tr.selection.to - 2, undefined, {
        checked: match[match.length - 1] === "x"
      });
    };
    return [inputRule];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-9": () => this.editor.commands.toggleCheckList()
    };
  }
});
