"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItemNode = void 0;
const core_1 = require("@tiptap/core");
const commands_1 = require("../list-item/commands");
const extension_task_item_1 = require("@tiptap/extension-task-item");
const component_1 = require("./component");
const react_1 = require("../react");
exports.TaskItemNode = extension_task_item_1.TaskItem.extend({
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
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
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
        return Object.assign(Object.assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: ({ editor }) => (0, commands_1.onBackspacePressed)(editor, this.name, this.type) });
    },
    addNodeView() {
        return (0, react_1.createNodeView)(component_1.TaskItemComponent, {
            contentDOMFactory: true,
            wrapperFactory: () => document.createElement("li"),
            shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
                return (prev.checked !== next.checked || prev.collapsed !== next.collapsed);
            },
        });
    },
});
