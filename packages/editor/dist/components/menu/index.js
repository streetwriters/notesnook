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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useEffect, } from "react";
import { Box, Flex, Text } from "rebass";
import { getPosition } from "../../utils/position";
import { useFocus } from "./use-focus";
import { MenuSeparator } from "./menu-separator";
import { MenuButton } from "./menu-button";
import { PopupPresenter as _PopupPresenter, } from "../popup-presenter";
export function Menu(props) {
    var _a = props.items, items = _a === void 0 ? [] : _a, title = props.title, onClose = props.onClose, containerProps = __rest(props, ["items", "title", "onClose"]);
    var hoverTimeout = useRef();
    var onAction = useCallback(function (e, item) {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (onClose)
            onClose();
        if (item.onClick) {
            item.onClick();
        }
    }, [onClose]);
    var _b = useFocus(items, function (e) {
        var item = items[focusIndex];
        if (item)
            onAction(e, item);
    }, function () { return onClose(); }), focusIndex = _b.focusIndex, setFocusIndex = _b.setFocusIndex, isSubmenuOpen = _b.isSubmenuOpen, setIsSubmenuOpen = _b.setIsSubmenuOpen;
    var focusedItem = items[focusIndex];
    var subMenuRef = useRef(null);
    useEffect(function () {
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
        var _a = getPosition(subMenuRef.current, {
            // yOffset: menuItemElement.offsetHeight,
            target: menuItemElement,
            location: "right",
        }), top = _a.top, left = _a.left;
        subMenuRef.current.style.visibility = "visible";
        subMenuRef.current.style.top = "".concat(top, "px");
        subMenuRef.current.style.left = "".concat(left, "px");
    }, [isSubmenuOpen, focusIndex, items]);
    return (_jsxs(_Fragment, { children: [_jsx(MenuContainer, __assign({}, containerProps, { children: items.map(function (item, index) {
                    switch (item.type) {
                        case "separator":
                            return _jsx(MenuSeparator, {}, item.key);
                        case "button":
                            return (_jsx(MenuButton, { item: item, onClick: function (e) {
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
                            return _jsx(item.component, { onClick: function (e) { return onAction(e, item); } });
                    }
                }) })), (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.type) === "button" && (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.menu) && isSubmenuOpen && (_jsx(Flex, __assign({ ref: subMenuRef, style: { visibility: "hidden" }, sx: {
                    position: "absolute",
                } }, { children: _jsx(Menu, { items: focusedItem.menu.items, onClose: onClose }) })))] }));
}
function MenuContainer(props) {
    var children = props.children, title = props.title, sx = props.sx, flexProps = __rest(props, ["children", "title", "sx"]);
    return (_jsxs(Box, __assign({ className: "menuContainer", as: "ul", tabIndex: -1, sx: __assign({ bg: "background", py: 1, display: "flex", flexDirection: "column", position: "relative", listStyle: "none", padding: 0, margin: 0, borderRadius: "default", boxShadow: "menu", border: "1px solid var(--border)", minWidth: 220 }, sx) }, flexProps, { children: [title && (_jsx(Text, __assign({ sx: {
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
export function MenuPresenter(props) {
    var _a = props.items, items = _a === void 0 ? [] : _a, restProps = __rest(props, ["items"]);
    return (_jsx(_PopupPresenter, __assign({}, restProps, { children: props.children ? props.children : _jsx(Menu, __assign({ items: items }, restProps)) })));
}
