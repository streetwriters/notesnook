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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useEffect, useState, } from "react";
import { Box, Flex, Text } from "rebass";
import { getPosition } from "./useMenu";
// import { FlexScrollContainer } from "../scrollcontainer";
import MenuItem from "./menuitem";
// import { useMenuTrigger, useMenu, getPosition } from "../../hooks/useMenu";
import Modal from "react-modal";
import { useTheme } from "emotion-theming";
import Sheet from "react-modal-sheet";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
// import { store as selectionStore } from "../../stores/selectionstore";
function useMenuFocus(items, onAction, onClose) {
    var _a = __read(useState(-1), 2), focusIndex = _a[0], setFocusIndex = _a[1];
    var _b = __read(useState(false), 2), isSubmenuOpen = _b[0], setIsSubmenuOpen = _b[1];
    var moveItemIntoView = useCallback(function (index) {
        var item = items[index];
        if (!item)
            return;
        var element = document.getElementById(item.key);
        if (!element)
            return;
        element.scrollIntoView({
            behavior: "auto",
        });
    }, [items]);
    var onKeyDown = useCallback(function (e) {
        var isSeperator = function (i) { var _a, _b; return items && (((_a = items[i]) === null || _a === void 0 ? void 0 : _a.type) === "seperator" || ((_b = items[i]) === null || _b === void 0 ? void 0 : _b.isDisabled)); };
        var moveDown = function (i) { return (i < items.length - 1 ? ++i : 0); };
        var moveUp = function (i) { return (i > 0 ? --i : items.length - 1); };
        var hasSubmenu = function (i) { var _a; return items && ((_a = items[i]) === null || _a === void 0 ? void 0 : _a.hasSubmenu); };
        var openSubmenu = function (index) {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(true);
        };
        var closeSubmenu = function (index) {
            if (!hasSubmenu(index))
                return;
            setIsSubmenuOpen(false);
        };
        setFocusIndex(function (i) {
            var nextIndex = i;
            switch (e.key) {
                case "ArrowUp":
                    if (isSubmenuOpen)
                        break;
                    nextIndex = moveUp(i);
                    while (isSeperator(nextIndex)) {
                        nextIndex = moveUp(nextIndex);
                    }
                    break;
                case "ArrowDown":
                    if (isSubmenuOpen)
                        break;
                    nextIndex = moveDown(i);
                    while (isSeperator(nextIndex)) {
                        nextIndex = moveDown(nextIndex);
                    }
                    break;
                case "ArrowRight":
                    openSubmenu(i);
                    break;
                case "ArrowLeft":
                    closeSubmenu(i);
                    break;
                case "Enter":
                    onAction && onAction(e);
                    break;
                case "Escape":
                    onClose && onClose(e);
                    break;
                default:
                    break;
            }
            if (nextIndex !== i)
                moveItemIntoView(nextIndex);
            return nextIndex;
        });
    }, [items, isSubmenuOpen, moveItemIntoView, onAction]);
    useEffect(function () {
        window.addEventListener("keydown", onKeyDown);
        return function () {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onKeyDown]);
    return { focusIndex: focusIndex, setFocusIndex: setFocusIndex, isSubmenuOpen: isSubmenuOpen, setIsSubmenuOpen: setIsSubmenuOpen };
}
export function Menu(props) {
    var _a;
    var items = props.items, title = props.title, closeMenu = props.closeMenu, containerProps = __rest(props, ["items", "title", "closeMenu"]);
    var hoverTimeout = useRef();
    var onAction = useCallback(function (e, item) {
        e === null || e === void 0 ? void 0 : e.stopPropagation();
        if (closeMenu)
            closeMenu();
        if (item.onClick) {
            item.onClick();
        }
    }, [closeMenu]);
    var _b = useMenuFocus(items, function (e) {
        var item = items[focusIndex];
        if (item)
            onAction(e, item);
    }, function () { return closeMenu(); }), focusIndex = _b.focusIndex, setFocusIndex = _b.setFocusIndex, isSubmenuOpen = _b.isSubmenuOpen, setIsSubmenuOpen = _b.setIsSubmenuOpen;
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
    return (_jsxs(_Fragment, { children: [_jsx(MenuContainer, __assign({}, containerProps, { children: items.map(function (item, index) { return (_jsx(MenuItem, { item: item, onClick: function (e) {
                        var _a;
                        if ((_a = item.items) === null || _a === void 0 ? void 0 : _a.length) {
                            setFocusIndex(index);
                            setIsSubmenuOpen(true);
                        }
                        else
                            onAction(e, item);
                    }, isFocused: focusIndex === index, onMouseEnter: function () {
                        var _a;
                        if (item.isDisabled) {
                            setFocusIndex(-1);
                            return;
                        }
                        if (hoverTimeout.current)
                            clearTimeout(hoverTimeout.current);
                        setFocusIndex(index);
                        setIsSubmenuOpen(false);
                        if ((_a = item.items) === null || _a === void 0 ? void 0 : _a.length) {
                            hoverTimeout.current = setTimeout(function () {
                                setIsSubmenuOpen(true);
                            }, 500);
                        }
                    }, onMouseLeave: function () {
                        if (hoverTimeout.current)
                            clearTimeout(hoverTimeout.current);
                    } }, item.key)); }) })), isSubmenuOpen && (_jsx(Flex, __assign({ ref: subMenuRef, style: { visibility: "hidden" }, sx: {
                    position: "absolute",
                } }, { children: _jsx(Menu, { items: ((_a = items[focusIndex]) === null || _a === void 0 ? void 0 : _a.items) || [], closeMenu: closeMenu }) })))] }));
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
export function PopupPresenter(props) {
    var _a = props.mobile, mobile = _a === void 0 ? "menu" : _a, _b = props.desktop, desktop = _b === void 0 ? "menu" : _b, restProps = __rest(props, ["mobile", "desktop"]);
    var isMobile = useIsMobile();
    if (isMobile && mobile === "sheet")
        return _jsx(ActionSheetPresenter, __assign({}, restProps));
    else if (mobile === "menu" || desktop === "menu")
        return _jsx(MenuPresenter, __assign({}, restProps));
    else
        return props.isOpen ? _jsx(_Fragment, { children: props.children }) : null;
}
export function MenuPresenter(props) {
    var className = props.className, _a = props.options, options = _a === void 0 ? { type: "menu", position: {} } : _a, _b = props.items, items = _b === void 0 ? [] : _b, isOpen = props.isOpen, _c = props.onClose, onClose = _c === void 0 ? function () { } : _c, children = props.children, containerProps = __rest(props, ["className", "options", "items", "isOpen", "onClose", "children"]);
    var position = options.position, type = options.type;
    var isAutocomplete = type === "autocomplete";
    var contentRef = useRef();
    var repositionMenu = useCallback(function (position) {
        if (!contentRef.current || !position)
            return;
        var menu = contentRef.current;
        var menuPosition = getPosition(menu, position);
        menu.style.top = menuPosition.top + "px";
        menu.style.left = menuPosition.left + "px";
    }, []);
    useEffect(function () {
        repositionMenu(position);
    }, [position]);
    useEffect(function () {
        function onWindowResize() {
            repositionMenu(position);
        }
        window.addEventListener("resize", onWindowResize);
        return function () {
            window.removeEventListener("resize", onWindowResize);
        };
    }, [position]);
    return (_jsx(Modal, __assign({ contentRef: function (ref) { return (contentRef.current = ref); }, className: className || "menuContainer", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: true, shouldReturnFocusAfterClose: true, shouldCloseOnOverlayClick: true, shouldFocusAfterRender: !isAutocomplete, ariaHideApp: !isAutocomplete, preventScroll: !isAutocomplete, onRequestClose: onClose, portalClassName: className || "menuPresenter", onAfterOpen: function (obj) {
            if (!obj || !position)
                return;
            repositionMenu(position);
        }, overlayElement: function (props, contentEl) {
            return (_jsx(Box, __assign({}, props, { 
                //@ts-ignore
                style: __assign(__assign({}, props.style), { position: isAutocomplete ? "initial" : "fixed", zIndex: 1000, backgroundColor: isAutocomplete ? "transparent" : "unset" }) }, { children: contentEl })));
        }, contentElement: function (props, children) { return (_jsx(Box, __assign({}, props, { style: {}, sx: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                width: "fit-content",
                height: "fit-content",
                position: "absolute",
                backgroundColor: undefined,
                padding: 0,
                zIndex: 0,
                outline: 0,
                isolation: "isolate",
            } }, { children: children }))); }, style: {
            content: {},
            overlay: {
                zIndex: 999,
                background: "transparent",
            },
        } }, { children: props.children ? (props.children) : (_jsx(Menu, __assign({ items: items, closeMenu: onClose }, containerProps))) })));
}
export function ActionSheetPresenter(props) {
    var _a = props.items, items = _a === void 0 ? [] : _a, isOpen = props.isOpen, _b = props.onClose, onClose = _b === void 0 ? function () { } : _b, children = props.children, sx = props.sx, _c = props.blocking, blocking = _c === void 0 ? true : _c, containerProps = __rest(props, ["items", "isOpen", "onClose", "children", "sx", "blocking"]);
    var theme = useTheme();
    return (_jsxs(Sheet, __assign({ isOpen: isOpen, onClose: onClose, springConfig: {
            stiffness: 300,
            damping: 30,
            mass: 0.2,
            duration: 300,
        } }, { children: [_jsxs(Sheet.Container, __assign({ style: {
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    boxShadow: theme.shadows.menu,
                } }, { children: [_jsx(Sheet.Header, {}), _jsx(Sheet.Content, { children: props.children ? (props.children) : (_jsx(Menu, __assign({ items: items, closeMenu: onClose, sx: __assign({ flex: 1, boxShadow: "none", border: "none" }, sx) }, containerProps))) })] })), _jsx(Sheet.Backdrop, { style: { backgroundColor: "transparent", border: "none" }, onTap: onClose })] })));
}
