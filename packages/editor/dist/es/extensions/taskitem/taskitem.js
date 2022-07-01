import { mergeAttributes } from "@tiptap/core";
import { onBackspacePressed } from "../list-item/commands";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskItemComponent } from "./component";
import { createNodeView } from "../react";
export const TaskItemNode = TaskItem.extend({
    draggable: true,
    addAttributes() {
        return {
            checked: {
                default: false,
                keepOnSplit: false,
                parseHTML: (element) => element.classList.contains("checked"),
                renderHTML: (attributes) => ({
                    class: attributes.checked ? "checked" : "",
                }),
            },
        };
    },
    renderHTML({ node, HTMLAttributes }) {
        return [
            "li",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist--item",
            }),
            0,
        ];
    },
    parseHTML() {
        return [
            {
                tag: `li`,
                getAttrs: (node) => {
                    var _a;
                    if (node instanceof Node && node instanceof HTMLElement) {
                        return node.classList.contains("checklist--item") ||
                            ((_a = node.parentElement) === null || _a === void 0 ? void 0 : _a.classList.contains("checklist"))
                            ? null
                            : false;
                    }
                    return false;
                },
                priority: 51,
            },
        ];
    },
    addKeyboardShortcuts() {
        var _a;
        return Object.assign(Object.assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: ({ editor }) => onBackspacePressed(editor, this.name, this.type) });
    },
    addNodeView() {
        return createNodeView(TaskItemComponent, {
            contentDOMFactory: true,
            wrapperFactory: () => document.createElement("li"),
            shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
                return (prev.checked !== next.checked || prev.collapsed !== next.collapsed);
            },
        });
    },
});
