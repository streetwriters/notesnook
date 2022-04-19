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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { NodeViewWrapper } from "@tiptap/react";
import { ThemeProvider } from "emotion-theming";
import { ToolButton } from "../../toolbar/components/tool-button";
import { useRef } from "react";
import { MenuPresenter } from "../../components/menu/menu";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
export function AttachmentComponent(props) {
    var _a = props.node.attrs, hash = _a.hash, filename = _a.filename, size = _a.size;
    var editor = props.editor, updateAttributes = props.updateAttributes;
    var elementRef = useRef();
    var isActive = editor.isActive("attachment", { hash: hash });
    // const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>();
    var theme = editor.storage.theme;
    //   useEffect(() => {
    //     setIsToolbarVisible(isActive);
    //   }, [isActive]);
    return (_jsx(NodeViewWrapper, __assign({ as: "span" }, { children: _jsxs(ThemeProvider, __assign({ theme: theme }, { children: [_jsxs(Box, __assign({ ref: elementRef, as: "span", contentEditable: false, variant: "body", sx: {
                        display: "inline-flex",
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 1,
                        userSelect: "none",
                        alignItems: "center",
                        backgroundColor: "bgSecondary",
                        padding: "0px 5px 0px 5px",
                        borderRadius: "default",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        maxWidth: 250,
                        borderColor: isActive ? "primary" : "border",
                        ":hover": {
                            bg: "hover",
                        },
                    }, title: filename }, { children: [_jsx(Icon, { path: Icons.attachment, size: 14 }), _jsx(Text, __assign({ as: "span", sx: {
                                ml: "3px",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                            }, className: "filename" }, { children: filename })), _jsx(Text, __assign({ as: "span", className: "size", sx: {
                                ml: "7px",
                                fontSize: "0.7rem",
                                color: "fontTertiary",
                                flexShrink: 0,
                            } }, { children: formatBytes(size) }))] })), _jsx(MenuPresenter, __assign({ isOpen: isActive, onClose: function () { }, items: [], options: {
                        type: "autocomplete",
                        position: {
                            target: elementRef.current || undefined,
                            location: "top",
                            yOffset: -5,
                            isTargetAbsolute: true,
                            align: "end",
                        },
                    } }, { children: _jsx(AttachmentToolbar, { editor: editor }) }))] })) })));
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
function AttachmentToolbar(props) {
    var editor = props.editor;
    return (_jsx(Flex, __assign({ sx: {
            flexDirection: "column",
            // position: "absolute",
            // top: 0,
            mb: 2,
            zIndex: 9999,
            alignItems: "end",
        } }, { children: _jsxs(Flex, __assign({ sx: {
                bg: "background",
                boxShadow: "menu",
                flexWrap: "nowrap",
                borderRadius: "default",
                mb: 2,
            } }, { children: [_jsx(ToolButton, { toggled: false, title: "Download", id: "download", icon: "download", onClick: function () { }, iconSize: 16, sx: { mr: 1, p: "3px", borderRadius: "small" } }), _jsx(ToolButton, { toggled: false, title: "delete", id: "delete", icon: "delete", onClick: function () { }, iconSize: 16, sx: { mr: 0, p: "3px", borderRadius: "small" } })] })) })));
}
