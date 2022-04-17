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
// import { Check, ChevronRight, Pro } from "../icons";
import { useRef } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
function MenuItem(props) {
    var item = props.item, isFocused = props.isFocused, onMouseEnter = props.onMouseEnter, onMouseLeave = props.onMouseLeave, onClick = props.onClick;
    var title = item.title, key = item.key, 
    // color,
    icon = item.icon, 
    // iconColor,
    type = item.type, tooltip = item.tooltip, isDisabled = item.isDisabled, isChecked = item.isChecked, hasSubmenu = item.hasSubmenu, Component = item.component, modifier = item.modifier;
    var itemRef = useRef(null);
    if (type === "seperator")
        return (_jsx(Box, { as: "li", sx: {
                width: "95%",
                height: "0.5px",
                bg: "border",
                my: 2,
                alignSelf: "center",
            } }, key));
    return (_jsx(Flex, __assign({ as: "li", sx: { flex: 1, flexDirection: "column" }, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave }, { children: _jsx(Button, __assign({ id: key, "data-test-id": "menuitem-".concat(key), ref: itemRef, tabIndex: -1, variant: "menuitem", title: tooltip, disabled: isDisabled, onClick: onClick, sx: {
                bg: isFocused ? "hover" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            } }, { children: Component ? (_jsx(Component, {})) : (_jsxs(_Fragment, { children: [_jsxs(Flex, { children: [icon && (_jsx(Icon, { path: Icons[icon], color: "text", size: 15, sx: { mr: 2 } })), _jsx(Text, __assign({ as: "span", sx: {
                                    fontFamily: "body",
                                    fontSize: "menu",
                                    color: "text",
                                } }, { children: title }))] }), _jsxs(Flex, { children: [isChecked && _jsx(Icon, { path: Icons.check, size: 14 }), modifier && (_jsx(Text, __assign({ as: "span", sx: {
                                    fontFamily: "body",
                                    fontSize: "menu",
                                    color: "fontTertiary",
                                } }, { children: modifier })))] })] })) }), key) })));
}
export default MenuItem;
