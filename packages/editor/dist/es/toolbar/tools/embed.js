import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
import { EmbedPopup } from "../popups/embed-popup";
export function EmbedSettings(props) {
    const { editor } = props;
    const isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("embed") || !isBottom)
        return null;
    return (_jsx(MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "embedSettings", tools: [] })));
}
export function EmbedAlignLeft(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "left" }).run();
        } })));
}
export function EmbedAlignRight(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "right" }).run();
        } })));
}
export function EmbedAlignCenter(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setEmbedAlignment({ align: "center" }).run();
        } })));
}
// TODO: stop re-rendering
export function EmbedProperties(props) {
    const { editor } = props;
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef();
    // TODO: improve perf by deferring this until user opens the popup
    const embedNode = useMemo(() => findSelectedNode(editor, "embed"), []);
    const embed = ((embedNode === null || embedNode === void 0 ? void 0 : embedNode.attrs) || {});
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: () => setIsOpen((s) => !s) })), _jsx(ResponsivePresenter, Object.assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: () => setIsOpen(false), blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: _jsx(EmbedPopup, { title: "Embed properties", onClose: () => setIsOpen(false), embed: embed, onSourceChanged: (src) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setEmbedSource(src); }, onSizeChanged: (size) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setEmbedSize(size); } }) }))] }));
}
