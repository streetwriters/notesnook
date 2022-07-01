import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
export function AttachmentSettings(props) {
    const { editor } = props;
    const isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("attachment") || !isBottom)
        return null;
    return (_jsx(MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "attachmentSettings", tools: [] })));
}
export function DownloadAttachment(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            const attachmentNode = findSelectedNode(editor, "attachment");
            const attachment = ((attachmentNode === null || attachmentNode === void 0 ? void 0 : attachmentNode.attrs) || {});
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().downloadAttachment(attachment).run();
        } })));
}
export function RemoveAttachment(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().removeAttachment().run(); } })));
}
