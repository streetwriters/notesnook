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
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var rebass_1 = require("rebass");
var position_1 = require("../../utils/position");
var usefocus_1 = require("./usefocus");
var menuseparator_1 = require("./menuseparator");
var menubutton_1 = require("./menubutton");
var popuppresenter_1 = require("../popuppresenter");
function Menu(props) {
    var _a = props.items, items = _a === void 0 ? [] : _a, title = props.title, onClose = props.onClose, containerProps = __rest(props, ["items", "title", "onClose"]);
    var hoverTimeout = (0, react_1.useRef)();
    var onAction = (0, react_1.useCallback)(function (e, item) {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (item === null || item === void 0 ? void 0 : item.onClick) {
            item.onClick();
        }
        if (onClose)
            onClose();
    }, [onClose]);
    var _b = (0, usefocus_1.useFocus)(items, function (e) {
        var item = items[focusIndex];
        if (item && item.type === "button")
            onAction(e, item);
    }, function () { return onClose(); }), focusIndex = _b.focusIndex, setFocusIndex = _b.setFocusIndex, isSubmenuOpen = _b.isSubmenuOpen, setIsSubmenuOpen = _b.setIsSubmenuOpen;
    var focusedItem = items[focusIndex];
    var subMenuRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var item = items[focusIndex];
        if (!item || !subMenuRef.current)
            return;
        var menuItemElement = document.getElementById(item.key);
        if (!menuItemElement)
            return;
        if (!isSubmenuOpen) {
            subMenuRef.current.style.visibility = "hidden";
            return;
        }
        var _a = (0, position_1.getPosition)(subMenuRef.current, {
            // yOffset: menuItemElement.offsetHeight,
            target: menuItemElement,
            location: "right",
        }), top = _a.top, left = _a.left;
        subMenuRef.current.style.visibility = "visible";
        subMenuRef.current.style.top = "".concat(top, "px");
        subMenuRef.current.style.left = "".concat(left, "px");
    }, [isSubmenuOpen, focusIndex, items]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(MenuContainer, __assign({}, containerProps, { children: items.map(function (item, index) {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return (0, jsx_runtime_1.jsx)(menuseparator_1.MenuSeparator, {}, item.key);
                        case "button":
                            return ((0, jsx_runtime_1.jsx)(menubutton_1.MenuButton, { item: item, onClick: function (e) {
                                    if (item.menu) {
                                        setFocusIndex(index);
                                        setIsSubmenuOpen(true);
                                    }
                                    else
                                        onAction(e, item);
                                }, isFocused: focusIndex === index, onMouseEnter: function () {
                                    if (item.isDisabled) {
                                        setFocusIndex(-1);
                                        return;
                                    }
                                    if (hoverTimeout.current)
                                        clearTimeout(hoverTimeout.current);
                                    setFocusIndex(index);
                                    setIsSubmenuOpen(false);
                                    if (item.menu) {
                                        hoverTimeout.current = setTimeout(function () {
                                            setIsSubmenuOpen(true);
                                        }, 500);
                                    }
                                }, onMouseLeave: function () {
                                    if (hoverTimeout.current)
                                        clearTimeout(hoverTimeout.current);
                                } }, item.key));
                        case "popup":
                            return (0, jsx_runtime_1.jsx)(item.component, { onClick: function (e) { return onAction(e); } });
                    }
                }) })), (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.type) === "button" && (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.menu) && isSubmenuOpen && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ ref: subMenuRef, style: { visibility: "hidden" }, sx: {
                    position: "absolute",
                } }, { children: (0, jsx_runtime_1.jsx)(Menu, { items: focusedItem.menu.items, onClose: onClose }) })))] }));
}
exports.Menu = Menu;
function MenuContainer(props) {
    var children = props.children, title = props.title, sx = props.sx, flexProps = __rest(props, ["children", "title", "sx"]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Box, __assign({ className: "menuContainer", as: "ul", tabIndex: -1, sx: __assign({ bg: "background", py: 1, display: "flex", flexDirection: "column", position: "relative", listStyle: "none", padding: 0, margin: 0, borderRadius: "default", boxShadow: "menu", border: "1px solid var(--border)", minWidth: 220 }, sx) }, flexProps, { children: [title && ((0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ sx: {
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
    var _a = props.items, items = _a === void 0 ? [] : _a, restProps = __rest(props, ["items"]);
    return ((0, jsx_runtime_1.jsx)(popuppresenter_1.PopupPresenter, __assign({}, restProps, { children: props.children ? props.children : (0, jsx_runtime_1.jsx)(Menu, __assign({ items: items }, restProps)) })));
}
exports.MenuPresenter = MenuPresenter;
