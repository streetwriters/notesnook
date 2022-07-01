"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
// import { MenuPresenter } from "../../components/menu/menu";
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const toolbargroup_1 = require("../../toolbar/components/toolbargroup");
const responsive_1 = require("../../components/responsive");
function AttachmentComponent(props) {
    const { editor, node, selected } = props;
    const { hash, filename, size, progress } = node.attrs;
    const elementRef = (0, react_1.useRef)();
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Box, Object.assign({ ref: elementRef, as: "span", contentEditable: false, variant: "body", sx: {
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
            }, title: filename }, { children: [(0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.attachment, size: 14 }), (0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ as: "span", sx: {
                        ml: "small",
                        fontSize: "body",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    } }, { children: filename })), (0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ as: "span", sx: {
                        ml: 1,
                        fontSize: "0.65rem",
                        color: "fontTertiary",
                        flexShrink: 0,
                    } }, { children: progress ? `${progress}%` : formatBytes(size) })), (0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { editor: editor, tools: ["removeAttachment", "downloadAttachment"], sx: {
                            boxShadow: "menu",
                            borderRadius: "default",
                            bg: "background",
                            position: "absolute",
                            top: -35,
                        } })) })] })) }));
}
exports.AttachmentComponent = AttachmentComponent;
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0)
        return "0B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
