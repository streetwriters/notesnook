"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuPresenter = exports.Menu = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const rebass_1 = require("rebass");
const position_1 = require("../../utils/position");
const usefocus_1 = require("./usefocus");
const menuseparator_1 = require("./menuseparator");
const menubutton_1 = require("./menubutton");
const popuppresenter_1 = require("../popuppresenter");
function Menu(props) {
    const { items = [], title, onClose } = props, containerProps = __rest(props, ["items", "title", "onClose"]);
    const hoverTimeout = (0, react_1.useRef)();
    const onAction = (0, react_1.useCallback)((e, item) => {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (item === null || item === void 0 ? void 0 : item.onClick) {
            item.onClick();
        }
        if (onClose)
            onClose();
    }, [onClose]);
    const { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen } = (0, usefocus_1.useFocus)(items, (e) => {
        const item = items[focusIndex];
        if (item && item.type === "button")
            onAction(e, item);
    }, () => onClose());
    const focusedItem = items[focusIndex];
    const subMenuRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const item = items[focusIndex];
        if (!item || !subMenuRef.current)
            return;
        const menuItemElement = document.getElementById(item.key);
        if (!menuItemElement)
            return;
        if (!isSubmenuOpen) {
            subMenuRef.current.style.visibility = "hidden";
            return;
        }
        const { top, left } = (0, position_1.getPosition)(subMenuRef.current, {
            // yOffset: menuItemElement.offsetHeight,
            target: menuItemElement,
            location: "right",
        });
        subMenuRef.current.style.visibility = "visible";
        subMenuRef.current.style.top = `${top}px`;
        subMenuRef.current.style.left = `${left}px`;
    }, [isSubmenuOpen, focusIndex, items]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(MenuContainer, Object.assign({}, containerProps, { children: items.map((item, index) => {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return (0, jsx_runtime_1.jsx)(menuseparator_1.MenuSeparator, {}, item.key);
                        case "button":
                            return ((0, jsx_runtime_1.jsx)(menubutton_1.MenuButton, { item: item, onClick: (e) => {
                                    if (item.menu) {
                                        setFocusIndex(index);
                                        setIsSubmenuOpen(true);
                                    }
                                    else
                                        onAction(e, item);
                                }, isFocused: focusIndex === index, onMouseEnter: () => {
                                    if (item.isDisabled) {
                                        setFocusIndex(-1);
                                        return;
                                    }
                                    if (hoverTimeout.current)
                                        clearTimeout(hoverTimeout.current);
                                    setFocusIndex(index);
                                    setIsSubmenuOpen(false);
                                    if (item.menu) {
                                        hoverTimeout.current = setTimeout(() => {
                                            setIsSubmenuOpen(true);
                                        }, 500);
                                    }
                                }, onMouseLeave: () => {
                                    if (hoverTimeout.current)
                                        clearTimeout(hoverTimeout.current);
                                } }, item.key));
                        case "popup":
                            return (0, jsx_runtime_1.jsx)(item.component, { onClick: (e) => onAction(e) });
                    }
                }) })), (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.type) === "button" && (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.menu) && isSubmenuOpen && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ ref: subMenuRef, style: { visibility: "hidden" }, sx: {
                    position: "absolute",
                } }, { children: (0, jsx_runtime_1.jsx)(Menu, { items: focusedItem.menu.items, onClose: onClose }) })))] }));
}
exports.Menu = Menu;
function MenuContainer(props) {
    const { children, title, sx } = props, flexProps = __rest(props, ["children", "title", "sx"]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Box, Object.assign({ className: "menuContainer", as: "ul", tabIndex: -1, sx: Object.assign({ bg: "background", py: 1, display: "flex", flexDirection: "column", position: "relative", listStyle: "none", padding: 0, margin: 0, borderRadius: "default", boxShadow: "menu", border: "1px solid var(--border)", minWidth: 220 }, sx) }, flexProps, { children: [title && ((0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ sx: {
                    fontFamily: "body",
                    fontSize: "subtitle",
                    color: "primary",
                    py: "8px",
                    px: 3,
                    borderBottom: "1px solid",
                    borderBottomColor: "border",
                    wordWrap: "break-word",
                } }, { children: title }))), children] })));
}
function MenuPresenter(props) {
    const { items = [] } = props, restProps = __rest(props, ["items"]);
    return ((0, jsx_runtime_1.jsx)(popuppresenter_1.PopupPresenter, Object.assign({}, restProps, { children: props.children ? props.children : (0, jsx_runtime_1.jsx)(Menu, Object.assign({ items: items }, restProps)) })));
}
exports.MenuPresenter = MenuPresenter;
