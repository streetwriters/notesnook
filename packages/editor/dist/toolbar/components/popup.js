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
    var title = props.title, onClose = props.onClose, children = props.children;
    return (_jsxs(_Fragment, { children: [_jsx(DesktopOnly, { children: _jsxs(Flex, __assign({ sx: {
                        overflow: "hidden",
                        bg: "background",
                        flexDirection: "column",
                        borderRadius: "default",
                        // border: "1px solid var(--border)",
                        boxShadow: "menu",
                        minWidth: 200,
                    } }, { children: [_jsxs(Flex, __assign({ className: "movable", sx: {
                                bg: "bgSecondary",
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 1,
                                mb: 1,
                            } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: title })), _jsx(Button, __assign({ variant: "tool", sx: { p: 0, bg: "transparent" }, onClick: onClose }, { children: _jsx(Icon, { path: Icons.close, size: 16 }) }))] })), children] })) }), _jsx(MobileOnly, { children: children })] }));
}
