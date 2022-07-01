import { Node, nodeInputRule, mergeAttributes, findChildren, } from "@tiptap/core";
import { getDataAttribute } from "../attachment";
import { createSelectionBasedNodeView, } from "../react";
import { ImageComponent } from "./component";
export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
export const ImageNode = Node.create({
    name: "image",
    addOptions() {
        return {
            inline: false,
            allowBase64: false,
            HTMLAttributes: {},
        };
    },
    inline() {
        return this.options.inline;
    },
    group() {
        return this.options.inline ? "inline" : "block";
    },
    draggable: true,
    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: { default: null },
            height: { default: null },
            float: getDataAttribute("float", false),
            align: getDataAttribute("align", "left"),
            hash: getDataAttribute("hash"),
            filename: getDataAttribute("filename"),
            type: getDataAttribute("mime"),
            size: getDataAttribute("size"),
        };
    },
    parseHTML() {
        return [
            {
                tag: this.options.allowBase64 ? "img" : 'img:not([src^="data:"])',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "img",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return createSelectionBasedNodeView(ImageComponent);
    },
    addCommands() {
        return {
            insertImage: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
            setImageAlignment: (options) => ({ commands }) => {
                return commands.updateAttributes(this.name, Object.assign({}, options));
            },
            setImageSize: (options) => ({ commands }) => {
                return commands.updateAttributes(this.name, Object.assign({}, options));
            },
            updateImage: (options) => ({ state, tr, dispatch }) => {
                const query = options.hash
                    ? { key: "hash", value: options.hash }
                    : options.src
                        ? { key: "src", value: options.src }
                        : null;
                if (!query)
                    return false;
                const images = findChildren(state.doc, (node) => node.type.name === this.name &&
                    node.attrs[query.key] === query.value);
                for (const image of images) {
                    tr.setNodeMarkup(image.pos, image.node.type, Object.assign(Object.assign({}, image.node.attrs), options));
                }
                tr.setMeta("preventUpdate", true);
                tr.setMeta("addToHistory", false);
                if (dispatch)
                    dispatch(tr);
                return true;
            },
        };
    },
    addInputRules() {
        return [
            nodeInputRule({
                find: inputRegex,
                type: this.type,
                getAttributes: (match) => {
                    const [, , alt, src, title] = match;
                    return { src, alt, title };
                },
            }),
        ];
    },
});
