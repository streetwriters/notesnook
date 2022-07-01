"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskListNode = void 0;
const core_1 = require("@tiptap/core");
const extension_task_list_1 = require("@tiptap/extension-task-list");
const react_1 = require("../react");
const component_1 = require("./component");
exports.TaskListNode = extension_task_list_1.TaskList.extend({
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
            title: {
                default: null,
                keepOnSplit: false,
                parseHTML: (element) => element.dataset.title,
                renderHTML: (attributes) => {
                    if (!attributes.title || attributes.nested) {
                        return {};
                    }
                    return {
                        "data-title": attributes.title,
                    };
                },
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: `ul`,
                getAttrs: (node) => {
                    if (node instanceof Node && node instanceof HTMLElement) {
                        return node.classList.contains("checklist") && null;
                    }
                    return false;
                },
                priority: 51,
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "ul",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
                class: "checklist",
            }),
            0,
        ];
    },
    addCommands() {
        return {
            toggleTaskList: () => ({ editor, commands, state, tr }) => {
                const { $from, $to } = state.selection;
                commands.toggleList(this.name, this.options.itemTypeName);
                const position = {
                    from: tr.mapping.map($from.pos),
                    to: tr.mapping.map($to.pos),
                };
                // There is a minor bug in Prosemirror or Tiptap where creating
                // nested node view causes the editor selection to act weird.
                // The solution is to manually force the editor back to the correct
                // position.
                // NOTE: We have to wrap this in setTimeout & use the editor
                // directly or else it won't run.
                setTimeout(() => editor.commands.setTextSelection(position), 0);
                return true;
            },
        };
    },
    addNodeView() {
        return (0, react_1.createNodeView)(component_1.TaskListComponent, {
            contentDOMFactory: () => {
                const content = document.createElement("ul");
                content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
