"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedNode = void 0;
const core_1 = require("@tiptap/core");
const react_1 = require("../react");
const component_1 = require("./component");
exports.EmbedNode = core_1.Node.create({
    name: "embed",
    content: "",
    marks: "",
    draggable: true,
    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },
    group() {
        return "block";
    },
    addAttributes() {
        return {
            src: {
                default: null,
            },
            width: { default: null },
            height: { default: null },
            align: { default: "left" },
        };
    },
    parseHTML() {
        return [
            {
                tag: "iframe[src]",
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "iframe",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return (0, react_1.createSelectionBasedNodeView)(component_1.EmbedComponent);
    },
    addCommands() {
        return {
            insertEmbed: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
            setEmbedAlignment: (options) => ({ commands }) => {
                return commands.updateAttributes(this.name, Object.assign({}, options));
            },
            setEmbedSize: (options) => ({ commands }) => {
                return commands.updateAttributes(this.name, Object.assign({}, options));
            },
            setEmbedSource: (src) => ({ commands }) => {
                return commands.updateAttributes(this.name, { src });
            },
        };
    },
});
