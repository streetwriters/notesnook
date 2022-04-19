import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AttachmentComponent } from "./component";
export var AttachmentNode = Node.create({
    name: "attachment",
    content: "inline*",
    marks: "",
    inline: true,
    atom: true,
    addOptions: function () {
        return {
            //   HTMLAttributes: {},
            onDownloadAttachment: function () { return false; },
        };
    },
    group: function () {
        return "inline";
    },
    draggable: true,
    addAttributes: function () {
        return {
            hash: getDataAttribute("hash"),
            filename: getDataAttribute("filename"),
            type: getDataAttribute("type"),
            size: getDataAttribute("size"),
        };
    },
    parseHTML: function () {
        return [
            {
                tag: "span[data-hash]",
            },
        ];
    },
    renderHTML: function (_a) {
        var HTMLAttributes = _a.HTMLAttributes;
        return ["span", mergeAttributes(HTMLAttributes)];
    },
    addNodeView: function () {
        return ReactNodeViewRenderer(AttachmentComponent);
    },
    addCommands: function () {
        var _this = this;
        return {
            insertAttachment: function (attachment) {
                return function (_a) {
                    var commands = _a.commands;
                    return commands.insertContent({
                        type: _this.name,
                        attrs: attachment,
                    });
                };
            },
            downloadAttachment: function (attachment) {
                return function (_a) {
                    return _this.options.onDownloadAttachment(attachment);
                };
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
function getDataAttribute(name) {
    return {
        default: null,
        parseHTML: function (element) { return element.dataset[name]; },
        renderHTML: function (attributes) {
            var _a;
            if (!attributes[name]) {
                return {};
            }
            return _a = {},
                _a["data-".concat(name)] = attributes[name],
                _a;
        },
    };
}
