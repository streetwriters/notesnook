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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { ToolButton } from "../../toolbar/components/tool-button";
import { useRef } from "react";
// import { MenuPresenter } from "../../components/menu/menu";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { PopupPresenter } from "../../components/popup-presenter";
export function AttachmentComponent(props) {
    var editor = props.editor, node = props.node, selected = props.selected;
    var _a = node.attrs, hash = _a.hash, filename = _a.filename, size = _a.size, progress = _a.progress;
    var elementRef = useRef();
    return (_jsxs(_Fragment, { children: [_jsxs(Box, __assign({ ref: elementRef, as: "span", contentEditable: false, variant: "body", sx: {
                    display: "inline-flex",
                    overflow: "hidden",
                    position: "relative",
                    justifyContent: "center",
                    userSelect: "none",
                    alignItems: "center",
                    backgroundColor: "bgSecondary",
                    px: 1,
                    borderRadius: "default",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    maxWidth: 250,
                    borderColor: selected ? "primary" : "border",
                    ":hover": {
                        bg: "hover",
                    },
                }, title: filename }, { children: [_jsx(Icon, { path: Icons.attachment, size: 14 }), _jsx(Text, __assign({ as: "span", sx: {
                            ml: "small",
                            fontSize: "body",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                        } }, { children: filename })), _jsx(Text, __assign({ as: "span", sx: {
                            ml: 1,
                            fontSize: "0.65rem",
                            color: "fontTertiary",
                            flexShrink: 0,
                        } }, { children: progress ? "".concat(progress, "%") : formatBytes(size) }))] })), _jsx(PopupPresenter, __assign({ isOpen: selected, onClose: function () { }, blocking: false, focusOnRender: false, position: {
                    target: elementRef.current || undefined,
                    align: "center",
                    location: "top",
                    yOffset: 5,
                    isTargetAbsolute: true,
                } }, { children: _jsx(AttachmentToolbar, { editor: editor }) }))] }));
}
function formatBytes(bytes, decimals) {
    if (decimals === void 0) { decimals = 1; }
    if (bytes === 0)
        return "0B";
    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
// TODO make this functional
function AttachmentToolbar(props) {
    var editor = props.editor;
    return (_jsxs(Flex, __assign({ sx: {
            bg: "background",
            boxShadow: "menu",
            flexWrap: "nowrap",
            borderRadius: "default",
        } }, { children: [_jsx(ToolButton, { toggled: false, title: "Download", id: "download", icon: "download", onClick: function () { }, sx: { mr: 1 } }), _jsx(ToolButton, { toggled: false, title: "delete", id: "delete", icon: "delete", onClick: function () { }, sx: { mr: 0 } })] })));
}
