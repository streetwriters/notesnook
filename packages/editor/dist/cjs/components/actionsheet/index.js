"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSheetPresenter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const rebass_1 = require("rebass");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const menubutton_1 = require("../menu/menubutton");
const menuseparator_1 = require("../menu/menuseparator");
const react_modal_1 = __importDefault(require("react-modal"));
const framer_motion_1 = require("framer-motion");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
const AnimatedFlex = (0, framer_motion_1.motion)(rebass_1.Flex);
const TRANSITION = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.2,
    duration: 300,
};
function useHistory(initial) {
    const [current, setCurrent] = (0, react_1.useState)(initial);
    const [canGoBack, setCanGoBack] = (0, react_1.useState)(false);
    const stack = (0, react_1.useRef)([initial]);
    const goBack = (0, react_1.useCallback)(() => {
        if (!canGoBack)
            return;
        const prev = stack.current.pop();
        setCurrent(prev);
        if (stack.current.length <= 1)
            setCanGoBack(false);
    }, [canGoBack]);
    const navigate = (0, react_1.useCallback)((state) => {
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
function ActionSheetPresenter(props) {
    var _a;
    const { isOpen, title, items, onClose, blocking = true, focusOnRender = true, draggable = true, children, } = props;
    const theme = (0, toolbarstore_1.useTheme)();
    const contentRef = (0, react_1.useRef)();
    const y = (0, framer_motion_1.useMotionValue)(0);
    const opacity = (0, framer_motion_1.useTransform)(y, [0, ((_a = contentRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || window.innerHeight], [1, 0]);
    const animation = (0, framer_motion_1.useAnimation)();
    const onBeforeClose = (0, react_1.useCallback)(() => {
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
    const handleBackPress = (0, react_1.useCallback)((event) => {
        if (!isOpen)
            return;
        event.preventDefault();
        onBeforeClose();
    }, [isOpen, onBeforeClose]);
    (0, react_1.useEffect)(() => {
        // Note: this is a custom event implemented on the React Native
        // side to handle back button when action sheet is opened.
        window.addEventListener("handleBackPress", handleBackPress);
        return () => {
            window.removeEventListener("handleBackPress", handleBackPress);
        };
    }, [handleBackPress]);
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)(react_modal_1.default, Object.assign({ contentRef: (ref) => (contentRef.current = ref), className: "bottom-sheet-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: blocking, shouldReturnFocusAfterClose: focusOnRender, shouldCloseOnOverlayClick: blocking, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: () => onBeforeClose(), portalClassName: "bottom-sheet-presenter-portal", onAfterOpen: () => {
            console.log("OPEGN!");
            animation.start({ transition: TRANSITION, y: 0 });
        }, overlayElement: (props, contentEl) => {
            return ((0, jsx_runtime_1.jsxs)(rebass_1.Box, Object.assign({}, props, { 
                //@ts-ignore
                style: Object.assign(Object.assign({}, props.style), { position: blocking ? "fixed" : "sticky", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }), tabIndex: -1 }, { children: [blocking && ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { id: "action-sheet-overlay", style: {
                            height: "100%",
                            width: "100%",
                            opacity,
                            position: "absolute",
                            backgroundColor: "var(--overlay)",
                        }, tabIndex: -1 })), contentEl] })));
        }, contentElement: (props, children) => ((0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({}, props, { style: {}, sx: {
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
            } }, { children: children }))) }, { children: (0, jsx_runtime_1.jsxs)(AnimatedFlex, Object.assign({ animate: animation, style: { y }, initial: { y: 1000 }, sx: {
                bg: "background",
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                boxShadow: (theme === null || theme === void 0 ? void 0 : theme.shadows.menu) || "none",
                flex: 1,
                flexDirection: "column",
            } }, { children: [draggable && ((0, jsx_runtime_1.jsx)(AnimatedFlex, Object.assign({ drag: "y", 
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
                    } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, { id: "pill", sx: {
                            backgroundColor: "hover",
                            width: 60,
                            height: 8,
                            borderRadius: 100,
                        } }) }))), (0, jsx_runtime_1.jsx)(ContentContainer, Object.assign({ items: items, title: title, onClose: onClose }, { children: children }))] })) })));
}
exports.ActionSheetPresenter = ActionSheetPresenter;
function ContentContainer(props) {
    var _a;
    const { title, items, onClose, children } = props;
    const { current, goBack, canGoBack, navigate } = useHistory({
        title,
        items,
    });
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexDirection: "column" } }, { children: [canGoBack || (current === null || current === void 0 ? void 0 : current.title) ? ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ id: "header", sx: { alignItems: "center", mx: 0, mb: 1 } }, { children: [canGoBack && ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ variant: "icon", sx: { p: 1, ml: 1 }, onClick: goBack }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.arrowLeft, size: "big" }) }))), (current === null || current === void 0 ? void 0 : current.title) && ((0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "title", sx: { ml: 1, fontSize: "title" } }, { children: current === null || current === void 0 ? void 0 : current.title })))] }))) : null, children
                ? children
                : (_a = current === null || current === void 0 ? void 0 : current.items) === null || _a === void 0 ? void 0 : _a.map((item) => {
                    if (item.isHidden)
                        return null;
                    switch (item.type) {
                        case "separator":
                            return (0, jsx_runtime_1.jsx)(menuseparator_1.MenuSeparator, {}, item.key);
                        case "button":
                            return ((0, jsx_runtime_1.jsx)(menubutton_1.MenuButton, { item: item, onClick: (e) => {
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
                            return ((0, jsx_runtime_1.jsx)(react_1.default.Fragment, { children: (0, jsx_runtime_1.jsx)(item.component, { onClick: onClose }) }, item.key));
                    }
                })] })));
}
