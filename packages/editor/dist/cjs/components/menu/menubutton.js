"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const rebass_1 = require("rebass");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
const button_1 = require("../button");
function MenuButton(props) {
    const { item, isFocused, onMouseEnter, onMouseLeave, onClick } = props;
    const { title, key, icon, tooltip, isDisabled, isChecked, menu, modifier, styles, } = item;
    const itemRef = (0, react_1.useRef)(null);
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    const isBottom = toolbarLocation === "bottom";
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ as: "li", sx: { flexShrink: 0, flexDirection: "column" }, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave }, { children: (0, jsx_runtime_1.jsxs)(button_1.Button, Object.assign({ id: key, "data-test-id": `MenuButton-${key}`, ref: itemRef, tabIndex: -1, variant: "menuitem", title: tooltip, disabled: isDisabled, onClick: onClick, sx: Object.assign(Object.assign({}, styles), { bg: isFocused && !isBottom ? "hover" : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", ":hover": {
                    bg: isBottom ? "transparent" : "hover",
                } }) }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { fontSize: "inherit", fontFamily: "inherit" } }, { children: [icon && ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons[icon], color: "text", size: "medium", sx: { mr: 2 } })), (0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ as: "span", variant: "body", sx: { fontSize: "inherit", fontFamily: "inherit" } }, { children: title }))] })), isChecked || menu || modifier ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { ml: 4 } }, { children: [isChecked && (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.check, size: "small" }), menu && (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.chevronRight, size: "small" }), modifier && ((0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ as: "span", sx: {
                                fontFamily: "body",
                                fontSize: "menu",
                                color: "fontTertiary",
                            } }, { children: modifier })))] }))) : null] }), key) })));
}
exports.MenuButton = MenuButton;
