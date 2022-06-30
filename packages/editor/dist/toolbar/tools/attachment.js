"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAttachment = exports.DownloadAttachment = exports.AttachmentSettings = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
var moretools_1 = require("../components/moretools");
var toolbarstore_1 = require("../stores/toolbarstore");
var prosemirror_1 = require("../utils/prosemirror");
function AttachmentSettings(props) {
    var editor = props.editor;
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("attachment") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "attachmentSettings", tools: [] })));
}
exports.AttachmentSettings = AttachmentSettings;
function DownloadAttachment(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            var attachmentNode = (0, prosemirror_1.findSelectedNode)(editor, "attachment");
            var attachment = ((attachmentNode === null || attachmentNode === void 0 ? void 0 : attachmentNode.attrs) || {});
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().downloadAttachment(attachment).run();
        } })));
}
exports.DownloadAttachment = DownloadAttachment;
function RemoveAttachment(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().removeAttachment().run(); } })));
}
exports.RemoveAttachment = RemoveAttachment;
