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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPopup = exports.usePopupHandler = exports.PopupWrapper = exports.PopupPresenter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const rebass_1 = require("rebass");
const position_1 = require("../../utils/position");
const react_modal_1 = __importDefault(require("react-modal"));
const react_dom_1 = __importDefault(require("react-dom"));
const emotion_theming_1 = require("emotion-theming");
const dom_1 = require("../../toolbar/utils/dom");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
const popuprenderer_1 = require("./popuprenderer");
const responsive_1 = require("../responsive");
function _PopupPresenter(props) {
    const { isOpen, position, onClose, blocking = true, focusOnRender = true, children, } = props;
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    const contentRef = (0, react_1.useRef)();
    const observerRef = (0, react_1.useRef)();
    const repositionPopup = (0, react_1.useCallback)(() => {
        if (!contentRef.current || !position)
            return;
        const popup = contentRef.current;
        const popupPosition = (0, position_1.getPosition)(popup, position);
        popup.style.top = popupPosition.top + "px";
        popup.style.left = popupPosition.left + "px";
    }, [position]);
    (0, react_1.useEffect)(() => {
        repositionPopup();
    }, [position]);
    (0, react_1.useEffect)(() => {
        function onWindowResize() {
            repositionPopup();
        }
        window.addEventListener("resize", onWindowResize);
        return () => {
            window.removeEventListener("resize", onWindowResize);
        };
    }, []);
    const attachMoveHandlers = (0, react_1.useCallback)(() => {
        if (!contentRef.current || !isOpen)
            return;
        const movableBar = contentRef.current.querySelector(".movable");
        if (!movableBar)
            return;
        const popup = contentRef.current;
        var offset = { x: 0, y: 0 };
        function mouseDown(e) {
            offset.x = e.clientX - popup.offsetLeft;
            offset.y = e.clientY - popup.offsetTop;
            window.addEventListener("mousemove", mouseMove);
        }
        function mouseMove(e) {
            if (!e.buttons)
                mouseUp();
            var top = e.clientY - offset.y;
            var left = e.clientX - offset.x;
            requestAnimationFrame(() => {
                popup.style.top = top + "px";
                popup.style.left = left + "px";
            });
        }
        function mouseUp() {
            window.removeEventListener("mousemove", mouseMove);
        }
        movableBar.addEventListener("mousedown", mouseDown);
        window.addEventListener("mouseup", mouseUp);
    }, [isOpen]);
    const handleResize = (0, react_1.useCallback)(() => {
        const popup = contentRef.current;
        if (!popup)
            return;
        let oldHeight = popup.offsetHeight;
        observerRef.current = new ResizeObserver((e) => {
            if (isMobile) {
                repositionPopup();
            }
            else {
                const { height, y } = popup.getBoundingClientRect();
                const delta = height - oldHeight;
                if (delta > 0) {
                    // means the new size is bigger so we need to adjust the position
                    // if required. We only do this in case the newly resized popup
                    // is going out of the window.
                    const windowHeight = document.body.clientHeight - 20;
                    if (y + height > windowHeight) {
                        popup.style.top = windowHeight - height + "px";
                    }
                }
                oldHeight = height;
            }
        });
        observerRef.current.observe(popup, { box: "border-box" });
    }, [isMobile]);
    return ((0, jsx_runtime_1.jsx)(react_modal_1.default, Object.assign({ contentRef: (ref) => (contentRef.current = ref), className: "popup-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: true, shouldReturnFocusAfterClose: true, shouldCloseOnOverlayClick: true, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: onClose, portalClassName: "popup-presenter-portal", onAfterOpen: (obj) => {
            if (!obj || !position)
                return;
            repositionPopup();
            handleResize();
            attachMoveHandlers();
        }, onAfterClose: () => { var _a; return (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect(); }, overlayElement: (props, contentEl) => {
            return ((0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({}, props, { 
                //@ts-ignore
                style: Object.assign(Object.assign({}, props.style), { position: !blocking ? "initial" : "fixed", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }) }, { children: contentEl })));
        }, contentElement: (props, children) => ((0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({}, props, { style: {}, 
            // TODO onMouseDown={(e) => {
            //   console.log(e);
            // }}
            sx: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                width: "fit-content",
                height: "fit-content",
                position: "fixed",
                backgroundColor: undefined,
                padding: 0,
                zIndex: 0,
                outline: 0,
                isolation: "isolate",
            } }, { children: children }))), style: {
            content: {},
            overlay: {
                zIndex: 999,
                background: "transparent",
            },
        } }, { children: children })));
}
function PopupPresenter(props) {
    // HACK: we don't want to render the popup presenter for no reason
    // including it's effects etc. so we just wrap it and return null
    // if the popup is closed.
    if (!props.isOpen)
        return null;
    return (0, jsx_runtime_1.jsx)(_PopupPresenter, Object.assign({}, props));
}
exports.PopupPresenter = PopupPresenter;
function PopupWrapper(props) {
    let { id, group, position, renderPopup, isOpen, onClosed, autoCloseOnUnmount } = props, presenterProps = __rest(props, ["id", "group", "position", "renderPopup", "isOpen", "onClosed", "autoCloseOnUnmount"]);
    const PopupRenderer = (0, popuprenderer_1.usePopupRenderer)();
    const { closePopup, isPopupOpen } = usePopupHandler(props);
    (0, react_1.useEffect)(() => {
        if (PopupRenderer && isPopupOpen) {
            PopupRenderer.openPopup(id, function Popup({ id }) {
                const isPopupOpen = (0, toolbarstore_1.useToolbarStore)((store) => !!store.openedPopups[id]);
                (0, react_1.useEffect)(() => {
                    if (!isPopupOpen) {
                        PopupRenderer.closePopup(id);
                    }
                }, [isPopupOpen]);
                return ((0, jsx_runtime_1.jsx)(PopupPresenter, Object.assign({ isOpen: isPopupOpen, onClose: () => closePopup(id), position: position, blocking: true, focusOnRender: true }, presenterProps, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ sx: {
                            boxShadow: "menu",
                            borderRadius: "default",
                            overflow: "hidden",
                            //          width,
                        } }, { children: (0, jsx_runtime_1.jsx)(popuprenderer_1.EditorContext.Consumer, { children: () => {
                                return renderPopup(() => PopupRenderer.closePopup(id));
                            } }) })) }), id));
            });
        }
    }, [PopupRenderer, isPopupOpen]);
    return null;
}
exports.PopupWrapper = PopupWrapper;
function usePopupHandler(options) {
    let { autoCloseOnUnmount, group, isOpen, id, onClosed, onClosePopup } = options;
    const isPopupOpen = (0, toolbarstore_1.useToolbarStore)((store) => !!store.openedPopups[id]);
    const openPopup = (0, toolbarstore_1.useToolbarStore)((store) => store.openPopup);
    const closePopup = (0, toolbarstore_1.useToolbarStore)((store) => store.closePopup);
    const closePopupGroup = (0, toolbarstore_1.useToolbarStore)((store) => store.closePopupGroup);
    const isBottom = (0, toolbarstore_1.useToolbarStore)((store) => store.toolbarLocation === "bottom");
    if (isBottom)
        group = "popup";
    (0, react_1.useEffect)(() => {
        if (isOpen)
            openPopup({ id, group });
        else
            closePopup(id);
    }, [isOpen, id, group, openPopup, closePopup]);
    (0, react_1.useEffect)(() => {
        if (!autoCloseOnUnmount)
            return;
        return () => {
            onClosePopup === null || onClosePopup === void 0 ? void 0 : onClosePopup();
        };
    }, [autoCloseOnUnmount, onClosePopup]);
    (0, react_1.useEffect)(() => {
        if (!isPopupOpen)
            onClosed === null || onClosed === void 0 ? void 0 : onClosed();
    }, [isPopupOpen]);
    (0, react_1.useEffect)(() => {
        if (isPopupOpen) {
            closePopupGroup(group, [id]);
        }
    }, [onClosed, isPopupOpen, closePopupGroup, id, group]);
    (0, react_1.useEffect)(() => {
        if (!isOpen)
            closePopup(id);
    }, [isOpen, id, group, closePopup]);
    return { isPopupOpen, closePopup };
}
exports.usePopupHandler = usePopupHandler;
function showPopup(options) {
    const { theme, popup } = options, props = __rest(options, ["theme", "popup"]);
    function hide() {
        react_dom_1.default.unmountComponentAtNode((0, dom_1.getPopupContainer)());
    }
    react_dom_1.default.render((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, Object.assign({ theme: theme }, { children: (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ isOpen: true, onClose: hide, position: {
                target: (0, dom_1.getToolbarElement)(),
                isTargetAbsolute: true,
                location: "below",
                align: "end",
                yOffset: 10,
            }, blocking: true, focusOnRender: true }, props, { children: popup(hide) })) })), (0, dom_1.getPopupContainer)());
    return hide;
}
exports.showPopup = showPopup;
