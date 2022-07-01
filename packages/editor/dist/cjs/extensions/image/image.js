"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageNode = exports.inputRegex = void 0;
const core_1 = require("@tiptap/core");
const attachment_1 = require("../attachment");
const react_1 = require("../react");
const component_1 = require("./component");
exports.inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;
exports.ImageNode = core_1.Node.create({
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
            float: (0, attachment_1.getDataAttribute)("float", false),
            align: (0, attachment_1.getDataAttribute)("align", "left"),
            hash: (0, attachment_1.getDataAttribute)("hash"),
            filename: (0, attachment_1.getDataAttribute)("filename"),
            type: (0, attachment_1.getDataAttribute)("mime"),
            size: (0, attachment_1.getDataAttribute)("size"),
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
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return (0, react_1.createSelectionBasedNodeView)(component_1.ImageComponent);
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
                const images = (0, core_1.findChildren)(state.doc, (node) => node.type.name === this.name &&
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
            (0, core_1.nodeInputRule)({
                find: exports.inputRegex,
                type: this.type,
                getAttributes: (match) => {
                    const [, , alt, src, title] = match;
                    return { src, alt, title };
                },
            }),
        ];
    },
});
