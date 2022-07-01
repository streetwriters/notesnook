import { Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { createNodeView } from "../react";
import { OutlineListComponent } from "./component";
export const inputRegex = /^\s*(-o)\s$/;
const outlineListItemName = `outlineListItem`;
export const OutlineList = Node.create({
    name: "outlineList",
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },
    addAttributes() {
        return {
            collapsed: {
                default: false,
                keepOnSplit: false,
                parseHTML: (element) => element.dataset.collapsed === "true",
                renderHTML: (attributes) => ({
                    "data-collapsed": attributes.collapsed === true,
                }),
            },
        };
    },
    group: "block list",
    content: `${outlineListItemName}+`,
    parseHTML() {
        return [
            {
                tag: `ul[data-type="${this.name}"]`,
                priority: 52,
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "ul",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                "data-type": this.name,
            }),
            0,
        ];
    },
    addCommands() {
        return {
            toggleOutlineList: () => ({ commands }) => {
                return commands.toggleList(this.name, outlineListItemName);
            },
        };
    },
    addKeyboardShortcuts() {
        return {
            "Mod-Shift-O": () => this.editor.commands.toggleOutlineList(),
        };
    },
    addInputRules() {
        return [
            wrappingInputRule({
                find: inputRegex,
                type: this.type,
            }),
        ];
    },
    addNodeView() {
        return createNodeView(OutlineListComponent, {
            contentDOMFactory: () => {
                const content = document.createElement("ul");
                content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
