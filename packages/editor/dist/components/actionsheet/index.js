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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSheetPresenter = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var emotion_theming_1 = require("emotion-theming");
var rebass_1 = require("rebass");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var menubutton_1 = require("../menu/menubutton");
var menuseparator_1 = require("../menu/menuseparator");
var react_modal_1 = __importDefault(require("react-modal"));
var framer_motion_1 = require("framer-motion");
var AnimatedFlex = (0, framer_motion_1.motion)(rebass_1.Flex);
var TRANSITION = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.2,
    duration: 300,
};
function useHistory(initial) {
    var _a = __read((0, react_1.useState)(initial), 2), current = _a[0], setCurrent = _a[1];
    var _b = __read((0, react_1.useState)(false), 2), canGoBack = _b[0], setCanGoBack = _b[1];
    var stack = (0, react_1.useRef)([initial]);
    var goBack = (0, react_1.useCallback)(function () {
        if (!canGoBack)
            return;
        var prev = stack.current.pop();
        setCurrent(prev);
        if (stack.current.length <= 1)
            setCanGoBack(false);
    }, [canGoBack]);
    var navigate = (0, react_1.useCallback)(function (state) {
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
function ActionSheetPresenter(props) {
    var _a;
    var isOpen = props.isOpen, title = props.title, items = props.items, onClose = props.onClose, _b = props.blocking, blocking = _b === void 0 ? true : _b, _c = props.focusOnRender, focusOnRender = _c === void 0 ? true : _c, _d = props.draggable, draggable = _d === void 0 ? true : _d, children = props.children;
    var theme = (0, emotion_theming_1.useTheme)();
    var contentRef = (0, react_1.useRef)();
    var y = (0, framer_motion_1.useMotionValue)(0);
    var opacity = (0, framer_motion_1.useTransform)(y, [0, ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight], [1, 0]);
    var animation = (0, framer_motion_1.useAnimation)();
    var onBeforeClose = (0, react_1.useCallback)(function () {
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
    var handleBackPress = (0, react_1.useCallback)(function (event) {
        if (!isOpen)
            return;
        event.preventDefault();
        onBeforeClose();
    }, [isOpen, onBeforeClose]);
    (0, react_1.useEffect)(function () {
        // Note: this is a custom event implemented on the React Native
        // side to handle back button when action sheet is opened.
        window.addEventListener("handleBackPress", handleBackPress);
        return function () {
            window.removeEventListener("handleBackPress", handleBackPress);
        };
    }, [handleBackPress]);
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)(react_modal_1.default, __assign({ contentRef: function (ref) { return (contentRef.current = ref); }, className: "bottom-sheet-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: blocking, shouldReturnFocusAfterClose: focusOnRender, shouldCloseOnOverlayClick: blocking, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: function () { return onBeforeClose(); }, portalClassName: "bottom-sheet-presenter-portal", onAfterOpen: function () {
            animation.start({ transition: TRANSITION, y: 0 });
        }, overlayElement: function (props, contentEl) {
            return ((0, jsx_runtime_1.jsxs)(rebass_1.Box, __assign({}, props, { 
                //@ts-ignore
                style: __assign(__assign({}, props.style), { position: blocking ? "fixed" : "sticky", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }), tabIndex: -1 }, { children: [blocking && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { id: "action-sheet-overlay", style: {
                            height: "100%",
                            width: "100%",
                            opacity: opacity,
                            position: "absolute",
                            backgroundColor: "var(--overlay)",
                        }, tabIndex: -1 })), contentEl] })));
        }, contentElement: function (props, children) { return ((0, jsx_runtime_1.jsx)(rebass_1.Box, __assign({}, props, { style: {}, sx: {
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
            } }, { children: children }))); } }, { children: (0, jsx_runtime_1.jsxs)(AnimatedFlex, __assign({ animate: animation, style: { y: y }, initial: { y: 1000 }, sx: {
                bg: "background",
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                boxShadow: theme.shadows.menu,
                flex: 1,
                flexDirection: "column",
            } }, { children: [draggable && ((0, jsx_runtime_1.jsx)(AnimatedFlex, __assign({ drag: "y", 
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
                    }, dragConstraints: { top: 0, bottom: 0 }, dragMomentum: false, dragElastic: false, sx: {
                        bg: "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, { id: "pill", sx: {
                            backgroundColor: "hover",
                            width: 60,
                            height: 8,
                            borderRadius: 100,
                        } }) }))), (0, jsx_runtime_1.jsx)(ContentContainer, __assign({ items: items, title: title, onClose: onClose }, { children: children }))] })) })));
}
exports.ActionSheetPresenter = ActionSheetPresenter;
function ContentContainer(props) {
    var _a;
    var title = props.title, items = props.items, onClose = props.onClose, children = props.children;
    var _b = useHistory({
        title: title,
        items: items,
    }), current = _b.current, goBack = _b.goBack, canGoBack = _b.canGoBack, navigate = _b.navigate;
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { flexDirection: "column" } }, { children: [canGoBack || (current === null || current === void 0 ? void 0 : current.title) ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ id: "header", sx: { alignItems: "center", mx: 0, mb: 1 } }, { children: [canGoBack && ((0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({ variant: "icon", sx: { p: 1, ml: 1 }, onClick: goBack }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.arrowLeft, size: "big" }) }))), (current === null || current === void 0 ? void 0 : current.title) && ((0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "title", sx: { ml: 1, fontSize: "title" } }, { children: current === null || current === void 0 ? void 0 : current.title })))] }))) : null, children
                ? children
                : (_a = current === null || current === void 0 ? void 0 : current.items) === null || _a === void 0 ? void 0 : _a.map(function (item) {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return (0, jsx_runtime_1.jsx)(menuseparator_1.MenuSeparator, {}, item.key);
                        case "button":
                            return ((0, jsx_runtime_1.jsx)(menubutton_1.MenuButton, { item: item, onClick: function (e) {
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
                            return ((0, jsx_runtime_1.jsx)(react_1.default.Fragment, { children: (0, jsx_runtime_1.jsx)(item.component, { onClick: onClose }) }, item.key));
                    }
                })] })));
}
