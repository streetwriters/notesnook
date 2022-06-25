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
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef, useEffect, } from "react";
import { Box } from "rebass";
import { getPosition } from "../../utils/position";
import Modal from "react-modal";
import ReactDOM from "react-dom";
import { ThemeProvider } from "emotion-theming";
import { getPopupContainer, getToolbarElement } from "../../toolbar/utils/dom";
import { useIsMobile, useToolbarStore, } from "../../toolbar/stores/toolbar-store";
import { EditorContext, usePopupRenderer, } from "./popuprenderer";
import { ResponsivePresenter } from "../responsive";
function _PopupPresenter(props) {
    var isOpen = props.isOpen, position = props.position, onClose = props.onClose, _a = props.blocking, blocking = _a === void 0 ? true : _a, _b = props.focusOnRender, focusOnRender = _b === void 0 ? true : _b, children = props.children;
    var isMobile = useIsMobile();
    var contentRef = useRef();
    var observerRef = useRef();
    var repositionPopup = useCallback(function () {
        if (!contentRef.current || !position)
            return;
        var popup = contentRef.current;
        var popupPosition = getPosition(popup, position);
        popup.style.top = popupPosition.top + "px";
        popup.style.left = popupPosition.left + "px";
        console.log("popup", popupPosition);
    }, [position]);
    useEffect(function () {
        repositionPopup();
    }, [position]);
    useEffect(function () {
        function onWindowResize() {
            repositionPopup();
        }
        window.addEventListener("resize", onWindowResize);
        return function () {
            window.removeEventListener("resize", onWindowResize);
        };
    }, []);
    var attachMoveHandlers = useCallback(function () {
        if (!contentRef.current || !isOpen)
            return;
        var movableBar = contentRef.current.querySelector(".movable");
        if (!movableBar)
            return;
        var popup = contentRef.current;
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
            requestAnimationFrame(function () {
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
    var handleResize = useCallback(function () {
        var popup = contentRef.current;
        if (!popup)
            return;
        var oldHeight = popup.offsetHeight;
        observerRef.current = new ResizeObserver(function (e) {
            if (isMobile) {
                repositionPopup();
            }
            else {
                var _a = popup.getBoundingClientRect(), height = _a.height, y = _a.y;
                var delta = height - oldHeight;
                if (delta > 0) {
                    // means the new size is bigger so we need to adjust the position
                    // if required. We only do this in case the newly resized popup
                    // is going out of the window.
                    var windowHeight = document.body.clientHeight - 20;
                    if (y + height > windowHeight) {
                        popup.style.top = windowHeight - height + "px";
                    }
                }
                oldHeight = height;
            }
        });
        observerRef.current.observe(popup, { box: "border-box" });
    }, [isMobile]);
    return (_jsx(Modal, __assign({ contentRef: function (ref) { return (contentRef.current = ref); }, className: "popup-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: true, shouldReturnFocusAfterClose: true, shouldCloseOnOverlayClick: true, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: onClose, portalClassName: "popup-presenter-portal", onAfterOpen: function (obj) {
            if (!obj || !position)
                return;
            repositionPopup();
            handleResize();
            attachMoveHandlers();
        }, onAfterClose: function () { var _a; return (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect(); }, overlayElement: function (props, contentEl) {
            return (_jsx(Box, __assign({}, props, { 
                //@ts-ignore
                style: __assign(__assign({}, props.style), { position: !blocking ? "initial" : "fixed", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }) }, { children: contentEl })));
        }, contentElement: function (props, children) { return (_jsx(Box, __assign({}, props, { style: {}, 
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
            } }, { children: children }))); }, style: {
            content: {},
            overlay: {
                zIndex: 999,
                background: "transparent",
            },
        } }, { children: children })));
}
export function PopupPresenter(props) {
    // HACK: we don't want to render the popup presenter for no reason
    // including it's effects etc. so we just wrap it and return null
    // if the popup is closed.
    if (!props.isOpen)
        return null;
    return _jsx(_PopupPresenter, __assign({}, props));
}
export function PopupWrapper(props) {
    var id = props.id, group = props.group, position = props.position, renderPopup = props.renderPopup, isOpen = props.isOpen, onClosed = props.onClosed, autoCloseOnUnmount = props.autoCloseOnUnmount, presenterProps = __rest(props, ["id", "group", "position", "renderPopup", "isOpen", "onClosed", "autoCloseOnUnmount"]);
    var closePopup = useToolbarStore(function (store) { return store.closePopup; });
    var openPopup = useToolbarStore(function (store) { return store.openPopup; });
    var closePopupGroup = useToolbarStore(function (store) { return store.closePopupGroup; });
    var isPopupOpen = useToolbarStore(function (store) { return !!store.openedPopups[id]; });
    var PopupRenderer = usePopupRenderer();
    var isBottom = useToolbarStore(function (store) { return store.toolbarLocation === "bottom"; });
    if (isBottom)
        group = "popup";
    useEffect(function () {
        if (isPopupOpen) {
            closePopupGroup(group, [id]);
        }
    }, [onClosed, isPopupOpen, closePopupGroup, id, group]);
    useEffect(function () {
        if (!isPopupOpen)
            onClosed === null || onClosed === void 0 ? void 0 : onClosed();
    }, [isPopupOpen]);
    useEffect(function () {
        if (isOpen)
            openPopup({ id: id, group: group });
        else
            closePopup(id);
    }, [isOpen, id, group, openPopup]);
    useEffect(function () {
        if (!autoCloseOnUnmount)
            return;
        return function () {
            PopupRenderer === null || PopupRenderer === void 0 ? void 0 : PopupRenderer.closePopup(id);
        };
    }, [autoCloseOnUnmount, id]);
    useEffect(function () {
        if (PopupRenderer && isPopupOpen) {
            PopupRenderer.openPopup(id, function () { return (_jsx(PopupPresenter, __assign({ isOpen: isPopupOpen, onClose: function () { return closePopup(id); }, position: position, blocking: true, focusOnRender: true }, presenterProps, { children: _jsx(Box, __assign({ sx: {
                        boxShadow: "menu",
                        borderRadius: "default",
                        overflow: "hidden",
                        //          width,
                    } }, { children: _jsx(EditorContext.Consumer, { children: function () {
                            return renderPopup(function () { return PopupRenderer.closePopup(id); });
                        } }) })) }), id)); });
        }
        else if (PopupRenderer && !isPopupOpen) {
            PopupRenderer.closePopup(id);
        }
    }, [PopupRenderer, isPopupOpen]);
    return null;
}
export function showPopup(options) {
    var theme = options.theme, popup = options.popup, props = __rest(options, ["theme", "popup"]);
    function hide() {
        ReactDOM.unmountComponentAtNode(getPopupContainer());
    }
    ReactDOM.render(_jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(ResponsivePresenter, __assign({ isOpen: true, onClose: hide, position: {
                target: getToolbarElement(),
                isTargetAbsolute: true,
                location: "below",
                align: "end",
                yOffset: 10,
            }, blocking: true, focusOnRender: true }, props, { children: popup(hide) })) })), getPopupContainer());
    return hide;
}
