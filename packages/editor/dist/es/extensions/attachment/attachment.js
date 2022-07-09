import { Node, mergeAttributes, findChildren } from "@tiptap/core";
import { createSelectionBasedNodeView } from "../react";
import { AttachmentComponent } from "./component";
export const AttachmentNode = Node.create({
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
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView() {
        return createSelectionBasedNodeView(AttachmentComponent, {
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
                const attachments = findChildren(state.doc, (node) => (node.type.name === this.name || node.type.name === "image") &&
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
export function getDataAttribute(name, def) {
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
