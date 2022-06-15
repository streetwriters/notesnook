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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useCallback, useRef, useState } from "react";
import { useTheme } from "emotion-theming";
import Sheet from "react-modal-sheet";
import { Button, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuButton } from "../menu/menu-button";
import { MenuSeparator } from "../menu/menu-separator";
function useHistory(initial) {
    var _a = __read(useState(initial), 2), current = _a[0], setCurrent = _a[1];
    var _b = __read(useState(false), 2), canGoBack = _b[0], setCanGoBack = _b[1];
    var stack = useRef([initial]);
    var goBack = useCallback(function () {
        if (!canGoBack)
            return;
        var prev = stack.current.pop();
        setCurrent(prev);
        if (stack.current.length <= 1)
            setCanGoBack(false);
    }, [canGoBack]);
    var navigate = useCallback(function (state) {
        console.log("NAVI", state);
        setCurrent(function (prev) {
            if (prev)
                stack.current.push(prev);
            return state;
        });
        setCanGoBack(true);
    }, []);
    return { current: current, goBack: goBack, navigate: navigate, canGoBack: canGoBack };
}
export function ActionSheetPresenter(props) {
    var isOpen = props.isOpen, title = props.title, items = props.items, onClose = props.onClose, _a = props.blocking, blocking = _a === void 0 ? true : _a, _b = props.focusOnRender, focusOnRender = _b === void 0 ? true : _b, children = props.children;
    var theme = useTheme();
    var contentRef = useRef();
    var focusedElement = useRef();
    // hijack the back button temporarily for a more native experience
    // on mobile phones.
    var onPopState = useCallback(function (e) {
        if (onClose) {
            onClose();
            e.preventDefault();
            return true;
        }
    }, [isOpen, onClose]);
    return (_jsxs(Sheet, __assign({ isOpen: isOpen, onClose: onClose || (function () { }), springConfig: {
            stiffness: 300,
            damping: 30,
            mass: 0.2,
            duration: 300,
        }, onOpenStart: function () {
            var _a;
            window.addEventListener("popstate", onPopState);
            window.addEventListener("beforeunload", onPopState);
            if (focusOnRender) {
                focusedElement.current =
                    document.activeElement || undefined;
                (_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
            }
        }, onCloseEnd: function () {
            var _a;
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("beforeunload", onPopState);
            if (focusOnRender) {
                (_a = focusedElement.current) === null || _a === void 0 ? void 0 : _a.focus({ preventScroll: true });
            }
        } }, { children: [_jsxs(Sheet.Container, __assign({ style: {
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    boxShadow: theme.shadows.menu,
                } }, { children: [_jsx(Sheet.Header, { disableDrag: !onClose }), _jsxs(Sheet.Content, { children: [_jsx("div", { id: "action-sheet-focus", ref: function (ref) { return (contentRef.current = ref || undefined); }, tabIndex: -1 }), _jsx(ContentContainer, __assign({ items: items, title: title, onClose: onClose }, { children: children }))] })] })), blocking ? (_jsx(Sheet.Backdrop, { style: { border: "none" }, onTap: onClose })) : (_jsx(_Fragment, {}))] })));
}
function ContentContainer(props) {
    var _a;
    var title = props.title, items = props.items, onClose = props.onClose, children = props.children;
    var _b = useHistory({
        title: title,
        items: items,
    }), current = _b.current, goBack = _b.goBack, canGoBack = _b.canGoBack, navigate = _b.navigate;
    return (_jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ id: "header", sx: { alignItems: "center", mx: 2, mb: 2 } }, { children: [canGoBack && (_jsx(Button, __assign({ variant: "icon", sx: { p: 1, mr: 2 }, onClick: goBack }, { children: _jsx(Icon, { path: Icons.chevronLeft, size: "big" }) }))), (current === null || current === void 0 ? void 0 : current.title) && (_jsx(Text, __assign({ variant: "title", sx: { ml: 1, fontSize: "title" } }, { children: current === null || current === void 0 ? void 0 : current.title })))] })), children
                ? children
                : (_a = current === null || current === void 0 ? void 0 : current.items) === null || _a === void 0 ? void 0 : _a.map(function (item) {
                    switch (item.type) {
                        case "separator":
                            return _jsx(MenuSeparator, {}, item.key);
                        case "button":
                            return (_jsx(MenuButton, { item: item, onClick: function (e) {
                                    if (item.menu) {
                                        navigate(item.menu);
                                    }
                                    else if (item.onClick) {
                                        item.onClick();
                                        onClose === null || onClose === void 0 ? void 0 : onClose();
                                    }
                                } }, item.key));
                        case "popup":
                            return (_jsx(React.Fragment, { children: _jsx(item.component, { onClick: onClose }) }, item.key));
                    }
                })] })));
}
