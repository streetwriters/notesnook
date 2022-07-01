import { Node, mergeAttributes } from "@tiptap/core";
import { createSelectionBasedNodeView, } from "../react";
import { EmbedComponent } from "./component";
export const EmbedNode = Node.create({
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
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return createSelectionBasedNodeView(EmbedComponent);
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
