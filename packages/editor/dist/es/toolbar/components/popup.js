import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { DesktopOnly, MobileOnly } from "../../components/responsive";
export function Popup(props) {
    const { title, onClose, action, children } = props;
    return (_jsxs(_Fragment, { children: [_jsx(DesktopOnly, { children: _jsxs(Flex, Object.assign({ sx: {
                        overflow: "hidden",
                        bg: "background",
                        flexDirection: "column",
                        borderRadius: "default",
                        // border: "1px solid var(--border)",
                        boxShadow: "menu",
                        minWidth: 200,
                    } }, { children: [title && (_jsxs(Flex, Object.assign({ className: "movable", sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                p: 2,
                            } }, { children: [_jsx(Text, Object.assign({ variant: "title" }, { children: title })), _jsx(Button, Object.assign({ variant: "tool", sx: { p: 0, bg: "transparent" }, onClick: onClose }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) }))] }))), children, title && action && (_jsx(Flex, Object.assign({ sx: { justifyContent: "end" }, bg: "bgSecondary", p: 1, px: 2, mt: 2 }, { children: _jsx(Button, Object.assign({ variant: "dialog", onClick: action.disabled || action.loading ? undefined : action.onClick, disabled: action.disabled || action.loading }, { children: action.loading ? (_jsx(Icon, { path: Icons.loading, rotate: true, size: "medium" })) : (action.title) })) })))] })) }), _jsxs(MobileOnly, { children: [children, action && (_jsx(Button, Object.assign({ variant: "primary", sx: {
                            alignSelf: "stretch",
                            mb: 1,
                            mt: 2,
                            mx: 1,
                            py: 2,
                        }, onClick: action.disabled ? undefined : action === null || action === void 0 ? void 0 : action.onClick, disabled: action.disabled }, { children: action.loading ? (_jsx(Icon, { path: Icons.loading, rotate: true, size: "medium" })) : (action.title) })))] })] }));
}
