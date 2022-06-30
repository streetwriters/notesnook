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
exports.AttachmentComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var react_1 = require("react");
// import { MenuPresenter } from "../../components/menu/menu";
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var toolbargroup_1 = require("../../toolbar/components/toolbargroup");
var responsive_1 = require("../../components/responsive");
function AttachmentComponent(props) {
    var editor = props.editor, node = props.node, selected = props.selected;
    var _a = node.attrs, hash = _a.hash, filename = _a.filename, size = _a.size, progress = _a.progress;
    var elementRef = (0, react_1.useRef)();
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Box, __assign({ ref: elementRef, as: "span", contentEditable: false, variant: "body", sx: {
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
            }, title: filename }, { children: [(0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.attachment, size: 14 }), (0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ as: "span", sx: {
                        ml: "small",
                        fontSize: "body",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    } }, { children: filename })), (0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ as: "span", sx: {
                        ml: 1,
                        fontSize: "0.65rem",
                        color: "fontTertiary",
                        flexShrink: 0,
                    } }, { children: progress ? "".concat(progress, "%") : formatBytes(size) })), (0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { editor: editor, tools: ["removeAttachment", "downloadAttachment"], sx: {
                            boxShadow: "menu",
                            borderRadius: "default",
                            bg: "background",
                            position: "absolute",
                            top: -35,
                        } })) })] })) }));
}
exports.AttachmentComponent = AttachmentComponent;
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
