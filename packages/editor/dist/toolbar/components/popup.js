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
exports.Popup = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var icon_1 = require("./icon");
var icons_1 = require("../icons");
var responsive_1 = require("../../components/responsive");
function Popup(props) {
    var title = props.title, onClose = props.onClose, action = props.action, children = props.children;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
                        overflow: "hidden",
                        bg: "background",
                        flexDirection: "column",
                        borderRadius: "default",
                        // border: "1px solid var(--border)",
                        boxShadow: "menu",
                        minWidth: 200,
                    } }, { children: [title && ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ className: "movable", sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 2,
                            } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "title" }, { children: title })), (0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({ variant: "tool", sx: { p: 0, bg: "transparent" }, onClick: onClose }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) }))] }))), children, title && action && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ sx: { justifyContent: "end" }, bg: "bgSecondary", p: 1, px: 2, mt: 2 }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({ variant: "dialog", onClick: action.disabled || action.loading ? undefined : action.onClick, disabled: action.disabled || action.loading }, { children: action.loading ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.loading, rotate: true, size: "medium" })) : (action.title) })) })))] })) }), (0, jsx_runtime_1.jsxs)(responsive_1.MobileOnly, { children: [children, action && ((0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({ variant: "primary", sx: {
                            alignSelf: "stretch",
                            mb: 1,
                            mt: 2,
                            mx: 1,
                            py: 2,
                        }, onClick: action.disabled ? undefined : action === null || action === void 0 ? void 0 : action.onClick, disabled: action.disabled }, { children: action.loading ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.loading, rotate: true, size: "medium" })) : (action.title) })))] })] }));
}
exports.Popup = Popup;
