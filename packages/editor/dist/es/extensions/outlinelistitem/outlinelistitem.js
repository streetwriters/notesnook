import { Node, mergeAttributes, findChildren } from "@tiptap/core";
import { findParentNodeOfTypeClosestToPos } from "prosemirror-utils";
import { onBackspacePressed } from "../list-item/commands";
import { OutlineList } from "../outline-list/outline-list";
import { createNodeView } from "../react";
import { OutlineListItemComponent } from "./component";
export const OutlineListItem = Node.create({
    name: "outlineListItem",
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },
    content: "heading* block*",
    defining: true,
    parseHTML() {
        return [
            {
                tag: `li[data-type="${this.name}"]`,
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "li",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    addKeyboardShortcuts() {
        return {
            "Mod-Space": ({ editor }) => {
                const subList = findSublist(editor, this.type);
                if (!subList)
                    return false;
                const { isCollapsed, subListPos } = subList;
                return this.editor.commands.toggleOutlineCollapse(subListPos, !isCollapsed);
            },
            Enter: ({ editor }) => {
                const subList = findSublist(editor, this.type);
                if (!subList)
                    return false;
                const { isCollapsed, subListPos } = subList;
                if (isCollapsed) {
                    return this.editor.commands.toggleOutlineCollapse(subListPos, false);
                }
                return this.editor.commands.splitListItem(this.name);
            },
            Tab: () => this.editor.commands.sinkListItem(this.name),
            "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
            Backspace: ({ editor }) => onBackspacePressed(editor, this.name, this.type),
        };
    },
    addCommands() {
        return {
            toggleOutlineCollapse: (pos, state) => ({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                    collapsed: state,
                });
                return true;
            },
        };
    },
    addNodeView() {
        return createNodeView(OutlineListItemComponent, {
            contentDOMFactory: true,
            //  wrapperFactory: () => document.createElement("li"),
        });
    },
});
function findSublist(editor, type) {
    var _a, _b;
    const { selection } = editor.state;
    const { $from } = selection;
    const listItem = findParentNodeOfTypeClosestToPos($from, type);
    if (!listItem)
        return false;
    const [subList] = findChildren(listItem.node, (node) => node.type.name === OutlineList.name);
    if (!subList)
        return false;
    const isNested = ((_a = subList === null || subList === void 0 ? void 0 : subList.node) === null || _a === void 0 ? void 0 : _a.type.name) === OutlineList.name;
    const isCollapsed = (_b = subList === null || subList === void 0 ? void 0 : subList.node) === null || _b === void 0 ? void 0 : _b.attrs.collapsed;
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
