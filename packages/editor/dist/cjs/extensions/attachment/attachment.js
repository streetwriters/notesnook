"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataAttribute = exports.AttachmentNode = void 0;
const core_1 = require("@tiptap/core");
const react_1 = require("../react");
const component_1 = require("./component");
exports.AttachmentNode = core_1.Node.create({
    name: "attachment",
    content: "inline*",
    marks: "",
    inline: true,
    atom: true,
    addOptions() {
        return {
            HTMLAttributes: {},
            onDownloadAttachment: () => false,
            onOpenAttachmentPicker: () => false,
        };
    },
    group() {
        return "inline";
    },
    draggable: true,
    addAttributes() {
        return {
            progress: {
                default: 0,
                rendered: false,
            },
            hash: getDataAttribute("hash"),
            filename: getDataAttribute("filename"),
            type: getDataAttribute("mime"),
            size: getDataAttribute("size"),
        };
    },
    parseHTML() {
        return [
            {
                tag: "span[data-hash]",
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            (0, core_1.mergeAttributes)(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return (0, react_1.createSelectionBasedNodeView)(component_1.AttachmentComponent, {
            shouldUpdate: ({ attrs: prev }, { attrs: next }) => {
                return prev.progress !== next.progress;
            },
        });
    },
    addCommands() {
        return {
            insertAttachment: (attachment) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attachment,
                });
            },
            removeAttachment: () => ({ commands, tr }) => {
                return commands.deleteSelection();
            },
            downloadAttachment: (attachment) => ({ editor }) => {
                return this.options.onDownloadAttachment(editor, attachment);
            },
            openAttachmentPicker: (type) => ({ editor }) => {
                return this.options.onOpenAttachmentPicker(editor, type);
            },
            setAttachmentProgress: (options) => ({ state, tr, dispatch }) => {
                const { hash, progress, type } = options;
                const attachments = (0, core_1.findChildren)(state.doc, (node) => (node.type.name === this.name || node.type.name === "image") &&
                    node.attrs.hash === hash);
                for (const attachment of attachments) {
                    tr.setNodeMarkup(attachment.pos, attachment.node.type, Object.assign(Object.assign({}, attachment.node.attrs), { progress: progress === 100 ? null : progress }));
                }
                tr.setMeta("preventUpdate", true);
                tr.setMeta("addToHistory", false);
                if (dispatch)
                    dispatch(tr);
                return true;
            },
        };
    },
    //   addInputRules() {
    //     return [
    //       nodeInputRule({
    //         find: inputRegex,
    //         type: this.type,
    //         getAttributes: (match) => {
    //           const [, , alt, src, title] = match;
    //           return { src, alt, title };
    //         },
    //       }),
    //     ];
    //   },
});
function getDataAttribute(name, def) {
    return {
        default: def,
        parseHTML: (element) => element.dataset[name],
        renderHTML: (attributes) => {
            if (!attributes[name]) {
                return {};
            }
            return {
                [`data-${name}`]: attributes[name],
            };
        },
    };
}
exports.getDataAttribute = getDataAttribute;
