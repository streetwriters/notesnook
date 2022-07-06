import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useToolbarLocation } from "../../toolbar/stores/toolbar-store";
import { Button } from "../button";
export function MenuButton(props) {
    const { item, isFocused, onMouseEnter, onMouseLeave, onClick } = props;
    const { title, key, icon, tooltip, isDisabled, isChecked, menu, modifier } = item;
    const itemRef = useRef(null);
    const toolbarLocation = useToolbarLocation();
    const isBottom = toolbarLocation === "bottom";
    return (_jsx(Flex, Object.assign({ as: "li", sx: { flexShrink: 0, flexDirection: "column" }, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave }, { children: _jsxs(Button, Object.assign({ id: key, "data-test-id": `MenuButton-${key}`, ref: itemRef, tabIndex: -1, variant: "menuitem", title: tooltip, disabled: isDisabled, onClick: onClick, sx: {
                bg: isFocused && !isBottom ? "hover" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                ":hover": {
                    bg: isBottom ? "transparent" : "hover",
                },
            } }, { children: [_jsxs(Flex, { children: [icon && (_jsx(Icon, { path: Icons[icon], color: "text", size: "medium", sx: { mr: 2 } })), _jsx(Text, Object.assign({ as: "span", variant: "body", sx: { fontSize: "inherit" } }, { children: title }))] }), isChecked || menu || modifier ? (_jsxs(Flex, Object.assign({ sx: { ml: 4 } }, { children: [isChecked && _jsx(Icon, { path: Icons.check, size: "small" }), menu && _jsx(Icon, { path: Icons.chevronRight, size: "small" }), modifier && (_jsx(Text, Object.assign({ as: "span", sx: {
                                fontFamily: "body",
                                fontSize: "menu",
                                color: "fontTertiary",
                            } }, { children: modifier })))] }))) : null] }), key) })));
}
