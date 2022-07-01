"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Popup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const icon_1 = require("./icon");
const icons_1 = require("../icons");
const responsive_1 = require("../../components/responsive");
function Popup(props) {
    const { title, onClose, action, children } = props;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                        overflow: "hidden",
                        bg: "background",
                        flexDirection: "column",
                        borderRadius: "default",
                        // border: "1px solid var(--border)",
                        boxShadow: "menu",
                        minWidth: 200,
                    } }, { children: [title && ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ className: "movable", sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 2,
                            } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "title" }, { children: title })), (0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ variant: "tool", sx: { p: 0, bg: "transparent" }, onClick: onClose }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) }))] }))), children, title && action && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: { justifyContent: "end" }, bg: "bgSecondary", p: 1, px: 2, mt: 2 }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ variant: "dialog", onClick: action.disabled || action.loading ? undefined : action.onClick, disabled: action.disabled || action.loading }, { children: action.loading ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.loading, rotate: true, size: "medium" })) : (action.title) })) })))] })) }), (0, jsx_runtime_1.jsxs)(responsive_1.MobileOnly, { children: [children, action && ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ variant: "primary", sx: {
                            alignSelf: "stretch",
                            mb: 1,
                            mt: 2,
                            mx: 1,
                            py: 2,
                        }, onClick: action.disabled ? undefined : action === null || action === void 0 ? void 0 : action.onClick, disabled: action.disabled }, { children: action.loading ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.loading, rotate: true, size: "medium" })) : (action.title) })))] })] }));
}
exports.Popup = Popup;
