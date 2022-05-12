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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
export function Popup(props) {
    var title = props.title, action = props.action, children = props.children;
    return (_jsxs(Flex, __assign({ sx: {
            bg: "background",
            flexDirection: "column",
            //  borderRadius: "default",
            // border: "1px solid var(--border)",
            // boxShadow: "menu",
        } }, { children: [title && (_jsxs(Flex, __assign({ sx: {
                    justifyContent: "space-between",
                    alignItems: "center",
                    mx: 1,
                    mt: 1,
                } }, { children: [_jsx(Text, __assign({ variant: "subtitle" }, { children: title })), action && (_jsx(PopupButton, __assign({ "data-test-id": "popup-no", color: "text" }, action)))] }))), children] })));
}
function PopupButton(props) {
    var text = props.text, loading = props.loading, icon = props.icon, iconColor = props.iconColor, iconSize = props.iconSize, restProps = __rest(props, ["text", "loading", "icon", "iconColor", "iconSize"]);
    return (_jsx(Button, __assign({ variant: "icon", sx: { p: 1, px: 2 } }, restProps, { children: loading ? (_jsx(Icon, { path: Icons.loading, size: 16, rotate: true, color: "primary" })) : icon ? (_jsx(Icon, { path: Icons[icon], size: iconSize || 18, color: iconColor || "icon" })) : (text) })));
}
