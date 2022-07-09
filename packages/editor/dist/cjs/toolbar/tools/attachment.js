"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAttachment = exports.DownloadAttachment = exports.AttachmentSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const moretools_1 = require("../components/moretools");
const toolbarstore_1 = require("../stores/toolbarstore");
const prosemirror_1 = require("../utils/prosemirror");
function AttachmentSettings(props) {
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("attachment") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "attachmentSettings", tools: ["downloadAttachment", "removeAttachment"] })));
}
exports.AttachmentSettings = AttachmentSettings;
function DownloadAttachment(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            const attachmentNode = (0, prosemirror_1.findSelectedNode)(editor, "attachment");
            const attachment = ((attachmentNode === null || attachmentNode === void 0 ? void 0 : attachmentNode.attrs) || {});
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().downloadAttachment(attachment).run();
        } })));
}
exports.DownloadAttachment = DownloadAttachment;
function RemoveAttachment(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().removeAttachment().run(); } })));
}
exports.RemoveAttachment = RemoveAttachment;
