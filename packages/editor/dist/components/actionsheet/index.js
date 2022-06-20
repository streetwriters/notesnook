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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef, useState } from "react";
import { useTheme } from "emotion-theming";
import { Box, Button, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuButton } from "../menu/menu-button";
import { MenuSeparator } from "../menu/menu-separator";
import Modal from "react-modal";
import { motion, useMotionValue, useTransform, useAnimation, } from "framer-motion";
var AnimatedFlex = motion(Flex);
var TRANSITION = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.2,
    duration: 300,
};
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
    var _a;
    var isOpen = props.isOpen, title = props.title, items = props.items, onClose = props.onClose, _b = props.blocking, blocking = _b === void 0 ? true : _b, _c = props.focusOnRender, focusOnRender = _c === void 0 ? true : _c, children = props.children;
    var theme = useTheme();
    var contentRef = useRef();
    var focusedElement = useRef();
    var y = useMotionValue(0);
    var opacity = useTransform(y, [0, ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight], [1, 0]);
    var animation = useAnimation();
    var onBeforeClose = useCallback(function () {
        var _a;
        var height = ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight;
        setTimeout(function () {
            onClose === null || onClose === void 0 ? void 0 : onClose();
        }, TRANSITION.duration - 50);
        animation.start({
            transition: TRANSITION,
            y: height + 100,
        });
    }, [animation, onClose, contentRef.current]);
    if (!isOpen)
        return null;
    return (_jsx(Modal, __assign({ contentRef: function (ref) { return (contentRef.current = ref); }, className: "bottom-sheet-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: blocking, shouldReturnFocusAfterClose: focusOnRender, shouldCloseOnOverlayClick: blocking, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: function () { return onBeforeClose(); }, portalClassName: "bottom-sheet-presenter-portal", onAfterOpen: function () {
            animation.start({ transition: TRANSITION, y: 0 });
        }, overlayElement: function (props, contentEl) {
            return (_jsxs(Box, __assign({}, props, { 
                //@ts-ignore
                style: __assign(__assign({}, props.style), { 
                    // position: blocking ? "initial" : "fixed",
                    zIndex: 1000, backgroundColor: "unset" }), tabIndex: -1 }, { children: [_jsx(motion.div, { style: {
                            height: "100%",
                            width: "100%",
                            opacity: opacity,
                            position: "absolute",
                            backgroundColor: blocking ? "var(--overlay)" : "transparent",
                        }, tabIndex: -1 }), contentEl] })));
        }, contentElement: function (props, children) { return (_jsx(Box, __assign({}, props, { style: {}, sx: {
                // top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                width: "auto",
                height: "fit-content",
                position: "fixed",
                backgroundColor: "transparent",
                padding: 0,
                zIndex: 0,
                outline: 0,
                isolation: "isolate",
            } }, { children: children }))); } }, { children: _jsxs(AnimatedFlex, __assign({ animate: animation, style: { y: y }, initial: { y: 1000 }, sx: {
                bg: "background",
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                boxShadow: theme.shadows.menu,
                flex: 1,
                flexDirection: "column",
            } }, { children: [_jsx(AnimatedFlex, __assign({ drag: "y", 
                    // @ts-ignore
                    onDrag: function (_, _a) {
                        var delta = _a.delta;
                        y.set(Math.max(y.get() + delta.y, 0));
                    }, 
                    // @ts-ignore
                    onDragEnd: function (_, _a) {
                        var velocity = _a.velocity;
                        if (velocity.y >= 500) {
                            onClose === null || onClose === void 0 ? void 0 : onClose();
                            return;
                        }
                        var sheetEl = contentRef.current;
                        var contentHeight = sheetEl.offsetHeight;
                        var threshold = 30;
                        var closingHeight = (contentHeight * threshold) / 100;
                        if (y.get() >= closingHeight) {
                            onBeforeClose();
                        }
                        else {
                            animation.start({ transition: TRANSITION, y: 0 });
                        }
                    }, onAnimationComplete: function () {
                        console.log("ED!");
                    }, dragConstraints: { top: 0, bottom: 0 }, dragMomentum: false, dragElastic: false, sx: {
                        bg: "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    } }, { children: _jsx(Box, { id: "pill", sx: {
                            backgroundColor: "hover",
                            width: 60,
                            height: 8,
                            borderRadius: 100,
                        } }) })), _jsx(ContentContainer, __assign({ items: items, title: title, onClose: onClose }, { children: children }))] })) })));
}
function ContentContainer(props) {
    var _a;
    var title = props.title, items = props.items, onClose = props.onClose, children = props.children;
    var _b = useHistory({
        title: title,
        items: items,
    }), current = _b.current, goBack = _b.goBack, canGoBack = _b.canGoBack, navigate = _b.navigate;
    return (_jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ id: "header", sx: { alignItems: "center", mx: 0, mb: 1 } }, { children: [canGoBack && (_jsx(Button, __assign({ variant: "icon", sx: { p: 1, ml: 1 }, onClick: goBack }, { children: _jsx(Icon, { path: Icons.arrowLeft, size: "big" }) }))), (current === null || current === void 0 ? void 0 : current.title) && (_jsx(Text, __assign({ variant: "title", sx: { ml: 1, fontSize: "title" } }, { children: current === null || current === void 0 ? void 0 : current.title })))] })), children
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
                                        onClose === null || onClose === void 0 ? void 0 : onClose();
                                        setTimeout(function () {
                                            var _a;
                                            (_a = item.onClick) === null || _a === void 0 ? void 0 : _a.call(item);
                                        }, 300);
                                    }
                                } }, item.key));
                        case "popup":
                            return (_jsx(React.Fragment, { children: _jsx(item.component, { onClick: onClose }) }, item.key));
                    }
                })] })));
}
