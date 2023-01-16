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

import { Node, mergeAttributes, findChildren, Editor } from "@tiptap/core";
import { NodeType } from "prosemirror-model";
import { findParentNodeOfTypeClosestToPos } from "../../utils/prosemirror";
import { onArrowUpPressed, onBackspacePressed } from "../list-item/commands";
import { OutlineList } from "../outline-list/outline-list";
import { createNodeView } from "../react";
import { OutlineListItemComponent } from "./component";

export interface ListItemOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    outlineListItem: {
      toggleOutlineCollapse: (subListPos: number, state: boolean) => ReturnType;
    };
  }
}

export const OutlineListItem = Node.create<ListItemOptions>({
  name: "outlineListItem",

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  content: "heading* paragraph block*",

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
        const subList = findSublist(editor, this.type);
        if (!subList) return false;
        const { isCollapsed, subListPos } = subList;

        return this.editor.commands.toggleOutlineCollapse(
          subListPos,
          !isCollapsed
        );
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
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
      Backspace: ({ editor }) =>
        onBackspacePressed(editor, this.name, this.type),
      ArrowUp: ({ editor }) => onArrowUpPressed(editor, this.name, this.type)
    };
  },

  addCommands() {
    return {
      toggleOutlineCollapse:
        (pos, state) =>
        ({ tr }) => {
          tr.setNodeMarkup(pos, undefined, {
            collapsed: state
          });
          return true;
        }
    };
  },

  addNodeView() {
    return createNodeView(OutlineListItemComponent, {
      contentDOMFactory: true,
      wrapperFactory: () => document.createElement("li")
    });
  }
});

function findSublist(editor: Editor, type: NodeType) {
  const { selection } = editor.state;
  const { $from } = selection;

  const listItem = findParentNodeOfTypeClosestToPos($from, type);
  if (!listItem) return false;

  const [subList] = findChildren(
    listItem.node,
    (node) => node.type.name === OutlineList.name
  );
  if (!subList) return false;

  const isNested = subList?.node?.type.name === OutlineList.name;
  const isCollapsed = subList?.node?.attrs.collapsed;
  const subListPos = listItem.pos + subList.pos + 1;

  return { isCollapsed, isNested, subListPos };
  // return (
  //   this.editor
  //     .chain()
  //     .command(({ tr }) => {
  //       tr.setNodeMarkup(listItem.pos + subList.pos + 1, undefined, {
  //         collapsed: !isCollapsed,
  //       });
  //       return true;
  //     })
  //     //.setTextSelection(listItem.pos + subList.pos + 1)
  //     //.splitListItem(this.name)
  //     .run()
  // );
}
