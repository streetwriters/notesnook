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
import { useRef } from "react";
import { Flex, Text, Button } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
export function MenuButton(props) {
    var item = props.item, isFocused = props.isFocused, onMouseEnter = props.onMouseEnter, onMouseLeave = props.onMouseLeave, onClick = props.onClick;
    var title = item.title, key = item.key, icon = item.icon, tooltip = item.tooltip, isDisabled = item.isDisabled, isChecked = item.isChecked, menu = item.menu, modifier = item.modifier;
    var itemRef = useRef(null);
    return (_jsx(Flex, __assign({ as: "li", sx: { flexShrink: 0, flexDirection: "column" }, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave }, { children: _jsxs(Button, __assign({ id: key, "data-test-id": "MenuButton-".concat(key), ref: itemRef, tabIndex: -1, variant: "menuitem", title: tooltip, disabled: isDisabled, onClick: onClick, sx: {
                bg: isFocused ? "hover" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                ":hover": {
                    bg: "hover",
                },
            } }, { children: [_jsxs(Flex, { children: [icon && (_jsx(Icon, { path: Icons[icon], color: "text", size: "medium", sx: { mr: 2 } })), _jsx(Text, __assign({ as: "span", variant: "body" }, { children: title }))] }), isChecked || menu || modifier ? (_jsxs(Flex, __assign({ sx: { ml: 4 } }, { children: [isChecked && _jsx(Icon, { path: Icons.check, size: 14 }), menu && _jsx(Icon, { path: Icons.chevronRight, size: 14 }), modifier && (_jsx(Text, __assign({ as: "span", sx: {
                                fontFamily: "body",
                                fontSize: "menu",
                                color: "fontTertiary",
                            } }, { children: modifier })))] }))) : null] }), key) })));
}
