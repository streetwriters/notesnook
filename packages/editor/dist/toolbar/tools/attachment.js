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
import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
export function AttachmentSettings(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("attachment") || !isBottom)
        return null;
    return (_jsx(MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "attachmentSettings", tools: [] })));
}
export function DownloadAttachment(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var attachmentNode = findSelectedNode(editor, "attachment");
            var attachment = ((attachmentNode === null || attachmentNode === void 0 ? void 0 : attachmentNode.attrs) || {});
            editor === null || editor === void 0 ? void 0 : editor.chain().focus().downloadAttachment(attachment).run();
        } })));
}
export function RemoveAttachment(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { return editor === null || editor === void 0 ? void 0 : editor.chain().focus().removeAttachment().run(); } })));
}
