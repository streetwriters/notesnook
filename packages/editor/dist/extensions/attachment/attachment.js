var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { Node, mergeAttributes, findChildren } from "@tiptap/core";
import { createSelectionBasedNodeView } from "../react";
import { AttachmentComponent } from "./component";
export var AttachmentNode = Node.create({
    name: "attachment",
    content: "inline*",
    marks: "",
    inline: true,
    atom: true,
    addOptions: function () {
        return {
            HTMLAttributes: {},
            onDownloadAttachment: function () { return false; },
            onOpenAttachmentPicker: function () { return false; },
        };
    },
    group: function () {
        return "inline";
    },
    draggable: true,
    addAttributes: function () {
        return {
            progress: {
                default: 0,
                rendered: false,
            },
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
        return [
            "span",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        ];
    },
    addNodeView: function () {
        return createSelectionBasedNodeView(AttachmentComponent, {
            shouldUpdate: function (_a, _b) {
                var prev = _a.attrs;
                var next = _b.attrs;
                return prev.progress !== next.progress;
            },
        });
    },
    addCommands: function () {
        var _this = this;
        return {
            insertAttachment: function (attachment) {
                return function (_a) {
                    var commands = _a.commands;
                    console.log("HI!", attachment);
                    return commands.insertContent({
                        type: _this.name,
                        attrs: attachment,
                    });
                };
            },
            downloadAttachment: function (attachment) {
                return function (_a) {
                    var editor = _a.editor;
                    return _this.options.onDownloadAttachment(editor, attachment);
                };
            },
            openAttachmentPicker: function (type) {
                return function (_a) {
                    var editor = _a.editor;
                    return _this.options.onOpenAttachmentPicker(editor, type);
                };
            },
            setAttachmentProgress: function (options) {
                return function (_a) {
                    var e_1, _b;
                    var state = _a.state, tr = _a.tr, dispatch = _a.dispatch;
                    var hash = options.hash, progress = options.progress, type = options.type;
                    var attachments = findChildren(state.doc, function (node) {
                        return (node.type.name === _this.name || node.type.name === "image") &&
                            node.attrs.hash === hash;
                    });
                    try {
                        for (var attachments_1 = __values(attachments), attachments_1_1 = attachments_1.next(); !attachments_1_1.done; attachments_1_1 = attachments_1.next()) {
                            var attachment = attachments_1_1.value;
                            console.log(attachment.node.attrs);
                            tr.setNodeMarkup(attachment.pos, attachment.node.type, __assign(__assign({}, attachment.node.attrs), { progress: progress }));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (attachments_1_1 && !attachments_1_1.done && (_b = attachments_1.return)) _b.call(attachments_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    tr.setMeta("preventUpdate", true);
                    tr.setMeta("addToHistory", false);
                    if (dispatch)
                        dispatch(tr);
                    return true;
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
export function getDataAttribute(name, def) {
    return {
        default: def,
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
