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
import { PopupPresenter } from "../popup-presenter";
export function Menu(props) {
    const { items = [], title, onClose } = props, containerProps = __rest(props, ["items", "title", "onClose"]);
    const hoverTimeout = useRef();
    const onAction = useCallback((e, item) => {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (item === null || item === void 0 ? void 0 : item.onClick) {
            item.onClick();
        }
        if (onClose)
            onClose();
    }, [onClose]);
    const { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen } = useFocus(items, (e) => {
        const item = items[focusIndex];
        if (item && item.type === "button")
            onAction(e, item);
    }, () => onClose());
    const focusedItem = items[focusIndex];
    const subMenuRef = useRef(null);
    useEffect(() => {
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
        const { top, left } = getPosition(subMenuRef.current, {
            // yOffset: menuItemElement.offsetHeight,
            target: menuItemElement,
            location: "right",
        });
        subMenuRef.current.style.visibility = "visible";
        subMenuRef.current.style.top = `${top}px`;
        subMenuRef.current.style.left = `${left}px`;
    }, [isSubmenuOpen, focusIndex, items]);
    return (_jsxs(_Fragment, { children: [_jsx(MenuContainer, Object.assign({}, containerProps, { children: items.map((item, index) => {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return _jsx(MenuSeparator, {}, item.key);
                        case "button":
                            return (_jsx(MenuButton, { item: item, onClick: (e) => {
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
                            return _jsx(item.component, { onClick: (e) => onAction(e) });
                    }
                }) })), (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.type) === "button" && (focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.menu) && isSubmenuOpen && (_jsx(Flex, Object.assign({ ref: subMenuRef, style: { visibility: "hidden" }, sx: {
                    position: "absolute",
                } }, { children: _jsx(Menu, { items: focusedItem.menu.items, onClose: onClose }) })))] }));
}
function MenuContainer(props) {
    const { children, title, sx } = props, flexProps = __rest(props, ["children", "title", "sx"]);
    return (_jsxs(Box, Object.assign({ className: "menuContainer", as: "ul", tabIndex: -1, sx: Object.assign({ bg: "background", py: 1, display: "flex", flexDirection: "column", position: "relative", listStyle: "none", padding: 0, margin: 0, borderRadius: "default", boxShadow: "menu", border: "1px solid var(--border)", minWidth: 220 }, sx) }, flexProps, { children: [title && (_jsx(Text, Object.assign({ sx: {
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
    const { items = [] } = props, restProps = __rest(props, ["items"]);
    return (_jsx(PopupPresenter, Object.assign({}, restProps, { children: props.children ? props.children : _jsx(Menu, Object.assign({ items: items }, restProps)) })));
}
