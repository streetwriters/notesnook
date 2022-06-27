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
import { Button, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { DesktopOnly, MobileOnly } from "../../components/responsive";
export function Popup(props) {
    var title = props.title, onClose = props.onClose, action = props.action, children = props.children;
    return (_jsxs(_Fragment, { children: [_jsx(DesktopOnly, { children: _jsxs(Flex, __assign({ sx: {
                        overflow: "hidden",
                        bg: "background",
                        flexDirection: "column",
                        borderRadius: "default",
                        // border: "1px solid var(--border)",
                        boxShadow: "menu",
                        minWidth: 200,
                    } }, { children: [title && (_jsxs(Flex, __assign({ className: "movable", sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 2,
                            } }, { children: [_jsx(Text, __assign({ variant: "title" }, { children: title })), _jsx(Button, __assign({ variant: "tool", sx: { p: 0, bg: "transparent" }, onClick: onClose }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) }))] }))), children, title && action && (_jsx(Flex, __assign({ sx: { justifyContent: "end" }, bg: "bgSecondary", p: 1, px: 2, mt: 2 }, { children: _jsx(Button, __assign({ variant: "dialog", onClick: action.disabled || action.loading ? undefined : action.onClick, disabled: action.disabled || action.loading }, { children: action.loading ? (_jsx(Icon, { path: Icons.loading, rotate: true, size: "medium" })) : (action.title) })) })))] })) }), _jsxs(MobileOnly, { children: [children, action && (_jsx(Button, __assign({ variant: "primary", sx: {
                            alignSelf: "stretch",
                            mb: 1,
                            mt: 2,
                            mx: 1,
                            py: 2,
                        }, onClick: action.disabled ? undefined : action === null || action === void 0 ? void 0 : action.onClick, disabled: action.disabled }, { children: action.loading ? (_jsx(Icon, { path: Icons.loading, rotate: true, size: "medium" })) : (action.title) })))] })] }));
}
