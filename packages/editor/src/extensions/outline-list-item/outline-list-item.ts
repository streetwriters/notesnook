import { Node, mergeAttributes, findChildren, Editor } from "@tiptap/core";
import { NodeType } from "prosemirror-model";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
import { onBackspacePressed } from "../list-item/commands";
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
        onBackspacePressed(editor, this.name, this.type)
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
