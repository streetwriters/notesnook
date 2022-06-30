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
exports.MenuButton = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var rebass_1 = require("rebass");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
var button_1 = require("../button");
function MenuButton(props) {
    var item = props.item, isFocused = props.isFocused, onMouseEnter = props.onMouseEnter, onMouseLeave = props.onMouseLeave, onClick = props.onClick;
    var title = item.title, key = item.key, icon = item.icon, tooltip = item.tooltip, isDisabled = item.isDisabled, isChecked = item.isChecked, menu = item.menu, modifier = item.modifier;
    var itemRef = (0, react_1.useRef)(null);
    var toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    var isBottom = toolbarLocation === "bottom";
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ as: "li", sx: { flexShrink: 0, flexDirection: "column" }, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave }, { children: (0, jsx_runtime_1.jsxs)(button_1.Button, __assign({ id: key, "data-test-id": "MenuButton-".concat(key), ref: itemRef, tabIndex: -1, variant: "menuitem", title: tooltip, disabled: isDisabled, onClick: onClick, sx: {
                bg: isFocused && !isBottom ? "hover" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                ":hover": {
                    bg: isBottom ? "transparent" : "hover",
                },
            } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, { children: [icon && ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons[icon], color: "text", size: "medium", sx: { mr: 2 } })), (0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ as: "span", variant: "body", sx: { fontSize: "inherit" } }, { children: title }))] }), isChecked || menu || modifier ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { ml: 4 } }, { children: [isChecked && (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.check, size: 14 }), menu && (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.chevronRight, size: 14 }), modifier && ((0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ as: "span", sx: {
                                fontFamily: "body",
                                fontSize: "menu",
                                color: "fontTertiary",
                            } }, { children: modifier })))] }))) : null] }), key) })));
}
exports.MenuButton = MenuButton;
