import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from "rebass";
import { useRef } from "react";
// import { MenuPresenter } from "../../components/menu/menu";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { DesktopOnly } from "../../components/responsive";
export function AttachmentComponent(props) {
    const { editor, node, selected } = props;
    const { hash, filename, size, progress } = node.attrs;
    const elementRef = useRef();
    return (_jsx(_Fragment, { children: _jsxs(Box, Object.assign({ ref: elementRef, as: "span", contentEditable: false, variant: "body", sx: {
                display: "inline-flex",
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
            }, title: filename }, { children: [_jsx(Icon, { path: Icons.attachment, size: 14 }), _jsx(Text, Object.assign({ as: "span", sx: {
                        ml: "small",
                        fontSize: "body",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    } }, { children: filename })), _jsx(Text, Object.assign({ as: "span", sx: {
                        ml: 1,
                        fontSize: "0.65rem",
                        color: "fontTertiary",
                        flexShrink: 0,
                    } }, { children: progress ? `${progress}%` : formatBytes(size) })), _jsx(DesktopOnly, { children: selected && (_jsx(ToolbarGroup, { editor: editor, tools: ["removeAttachment", "downloadAttachment"], sx: {
                            boxShadow: "menu",
                            borderRadius: "default",
                            bg: "background",
                            position: "absolute",
                            top: -35,
                        } })) })] })) }));
}
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0)
        return "0B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
