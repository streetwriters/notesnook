import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef, useState, useEffect, } from "react";
import { Box, Button, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuButton } from "../menu/menu-button";
import { MenuSeparator } from "../menu/menu-separator";
import Modal from "react-modal";
import { motion, useMotionValue, useTransform, useAnimation, } from "framer-motion";
import { useTheme } from "../../toolbar/stores/toolbar-store";
const AnimatedFlex = motion(Flex);
const TRANSITION = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.2,
    duration: 300,
};
function useHistory(initial) {
    const [current, setCurrent] = useState(initial);
    const [canGoBack, setCanGoBack] = useState(false);
    const stack = useRef([initial]);
    const goBack = useCallback(() => {
        if (!canGoBack)
            return;
        const prev = stack.current.pop();
        setCurrent(prev);
        if (stack.current.length <= 1)
            setCanGoBack(false);
    }, [canGoBack]);
    const navigate = useCallback((state) => {
        console.log("NAVI", state);
        setCurrent((prev) => {
            if (prev)
                stack.current.push(prev);
            return state;
        });
        setCanGoBack(true);
    }, []);
    return { current, goBack, navigate, canGoBack };
}
export function ActionSheetPresenter(props) {
    var _a;
    const { isOpen, title, items, onClose, blocking = true, focusOnRender = true, draggable = true, children, } = props;
    const theme = useTheme();
    const contentRef = useRef();
    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight], [1, 0]);
    const animation = useAnimation();
    const onBeforeClose = useCallback(() => {
        var _a;
        const height = ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight;
        setTimeout(() => {
            onClose === null || onClose === void 0 ? void 0 : onClose();
        }, TRANSITION.duration - 50);
        animation.start({
            transition: TRANSITION,
            y: height + 100,
        });
    }, [animation, onClose, contentRef.current]);
    const handleBackPress = useCallback((event) => {
        if (!isOpen)
            return;
        event.preventDefault();
        onBeforeClose();
    }, [isOpen, onBeforeClose]);
    useEffect(() => {
        // Note: this is a custom event implemented on the React Native
        // side to handle back button when action sheet is opened.
        window.addEventListener("handleBackPress", handleBackPress);
        return () => {
            window.removeEventListener("handleBackPress", handleBackPress);
        };
    }, [handleBackPress]);
    if (!isOpen)
        return null;
    return (_jsx(Modal, Object.assign({ contentRef: (ref) => (contentRef.current = ref), className: "bottom-sheet-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: blocking, shouldReturnFocusAfterClose: focusOnRender, shouldCloseOnOverlayClick: blocking, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: () => onBeforeClose(), portalClassName: "bottom-sheet-presenter-portal", onAfterOpen: () => {
            console.log("OPEGN!");
            animation.start({ transition: TRANSITION, y: 0 });
        }, overlayElement: (props, contentEl) => {
            return (_jsxs(Box, Object.assign({}, props, { 
                //@ts-ignore
                style: Object.assign(Object.assign({}, props.style), { position: blocking ? "fixed" : "sticky", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }), tabIndex: -1 }, { children: [blocking && (_jsx(motion.div, { id: "action-sheet-overlay", style: {
                            height: "100%",
                            width: "100%",
                            opacity,
                            position: "absolute",
                            backgroundColor: "var(--overlay)",
                        }, tabIndex: -1 })), contentEl] })));
        }, contentElement: (props, children) => (_jsx(Box, Object.assign({}, props, { style: {}, sx: {
                // top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                width: "auto",
                height: "fit-content",
                position: "fixed",
                backgroundColor: undefined,
                padding: 0,
                zIndex: 0,
                outline: 0,
                isolation: "isolate",
            } }, { children: children }))) }, { children: _jsxs(AnimatedFlex, Object.assign({ animate: animation, style: { y }, initial: { y: 1000 }, sx: {
                bg: "background",
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                boxShadow: (theme === null || theme === void 0 ? void 0 : theme.shadows.menu) || "none",
                flex: 1,
                flexDirection: "column",
            } }, { children: [draggable && (_jsx(AnimatedFlex, Object.assign({ drag: "y", 
                    // @ts-ignore
                    onDrag: (_, { delta }) => {
                        y.set(Math.max(y.get() + delta.y, 0));
                    }, 
                    // @ts-ignore
                    onDragEnd: (_, { velocity }) => {
                        if (velocity.y >= 500) {
                            onClose === null || onClose === void 0 ? void 0 : onClose();
                            return;
                        }
                        const sheetEl = contentRef.current;
                        const contentHeight = sheetEl.offsetHeight;
                        const threshold = 30;
                        const closingHeight = (contentHeight * threshold) / 100;
                        if (y.get() >= closingHeight) {
                            onBeforeClose();
                        }
                        else {
                            animation.start({ transition: TRANSITION, y: 0 });
                        }
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
                        } }) }))), _jsx(ContentContainer, Object.assign({ items: items, title: title, onClose: onClose }, { children: children }))] })) })));
}
function ContentContainer(props) {
    var _a;
    const { title, items, onClose, children } = props;
    const { current, goBack, canGoBack, navigate } = useHistory({
        title,
        items,
    });
    return (_jsxs(Flex, Object.assign({ sx: { flexDirection: "column" } }, { children: [canGoBack || (current === null || current === void 0 ? void 0 : current.title) ? (_jsxs(Flex, Object.assign({ id: "header", sx: { alignItems: "center", mx: 0, mb: 1 } }, { children: [canGoBack && (_jsx(Button, Object.assign({ variant: "icon", sx: { p: 1, ml: 1 }, onClick: goBack }, { children: _jsx(Icon, { path: Icons.arrowLeft, size: "big" }) }))), (current === null || current === void 0 ? void 0 : current.title) && (_jsx(Text, Object.assign({ variant: "title", sx: { ml: 1, fontSize: "title" } }, { children: current === null || current === void 0 ? void 0 : current.title })))] }))) : null, children
                ? children
                : (_a = current === null || current === void 0 ? void 0 : current.items) === null || _a === void 0 ? void 0 : _a.map((item) => {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return _jsx(MenuSeparator, {}, item.key);
                        case "button":
                            return (_jsx(MenuButton, { item: item, onClick: (e) => {
                                    if (item.menu) {
                                        navigate(item.menu);
                                    }
                                    else if (item.onClick) {
                                        onClose === null || onClose === void 0 ? void 0 : onClose();
                                        setTimeout(() => {
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
