"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineList = exports.inputRegex = void 0;
const core_1 = require("@tiptap/core");
const react_1 = require("../react");
const component_1 = require("./component");
exports.inputRegex = /^\s*(-o)\s$/;
const outlineListItemName = `outlineListItem`;
exports.OutlineList = core_1.Node.create({
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
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes, {
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
            (0, core_1.wrappingInputRule)({
                find: exports.inputRegex,
                type: this.type,
            }),
        ];
    },
    addNodeView() {
        return (0, react_1.createNodeView)(component_1.OutlineListComponent, {
            contentDOMFactory: () => {
                const content = document.createElement("ul");
                content.classList.add(`${this.name.toLowerCase()}-content-wrapper`);
                content.style.whiteSpace = "inherit";
                return { dom: content };
            },
        });
    },
});
