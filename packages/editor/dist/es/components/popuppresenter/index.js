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
import { getPopupContainer, getToolbarElement } from "../../toolbar/utils/dom";
import { useIsMobile, useToolbarStore, } from "../../toolbar/stores/toolbar-store";
import { EditorContext, usePopupRenderer, } from "./popuprenderer";
import { ResponsivePresenter } from "../responsive";
import { ThemeProvider } from "../theme-provider";
function _PopupPresenter(props) {
    const { isOpen, position, onClose, blocking = true, focusOnRender = true, children, } = props;
    const isMobile = useIsMobile();
    const contentRef = useRef();
    const observerRef = useRef();
    const repositionPopup = useCallback(() => {
        if (!contentRef.current || !position)
            return;
        const popup = contentRef.current;
        const popupPosition = getPosition(popup, position);
        popup.style.top = popupPosition.top + "px";
        popup.style.left = popupPosition.left + "px";
    }, [position]);
    useEffect(() => {
        repositionPopup();
    }, [position]);
    useEffect(() => {
        function onWindowResize() {
            repositionPopup();
        }
        window.addEventListener("resize", onWindowResize);
        return () => {
            window.removeEventListener("resize", onWindowResize);
        };
    }, []);
    const attachMoveHandlers = useCallback(() => {
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
    const handleResize = useCallback(() => {
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
    return (_jsx(Modal, Object.assign({ contentRef: (ref) => (contentRef.current = ref), className: "popup-presenter", role: "menu", isOpen: isOpen, appElement: document.body, shouldCloseOnEsc: true, shouldReturnFocusAfterClose: true, shouldCloseOnOverlayClick: true, shouldFocusAfterRender: focusOnRender, ariaHideApp: blocking, preventScroll: blocking, onRequestClose: onClose, portalClassName: "popup-presenter-portal", onAfterOpen: (obj) => {
            if (!obj || !position)
                return;
            repositionPopup();
            handleResize();
            attachMoveHandlers();
        }, onAfterClose: () => { var _a; return (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect(); }, overlayElement: (props, contentEl) => {
            return (_jsx(Box, Object.assign({}, props, { 
                //@ts-ignore
                style: Object.assign(Object.assign({}, props.style), { position: !blocking ? "initial" : "fixed", zIndex: 1000, backgroundColor: !blocking ? "transparent" : "unset" }) }, { children: contentEl })));
        }, contentElement: (props, children) => (_jsx(Box, Object.assign({}, props, { style: {}, 
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
export function PopupPresenter(props) {
    // HACK: we don't want to render the popup presenter for no reason
    // including it's effects etc. so we just wrap it and return null
    // if the popup is closed.
    if (!props.isOpen)
        return null;
    return _jsx(_PopupPresenter, Object.assign({}, props));
}
export function PopupWrapper(props) {
    let { id, group, position, renderPopup, isOpen, onClosed, autoCloseOnUnmount } = props, presenterProps = __rest(props, ["id", "group", "position", "renderPopup", "isOpen", "onClosed", "autoCloseOnUnmount"]);
    const PopupRenderer = usePopupRenderer();
    const { closePopup, isPopupOpen } = usePopupHandler(props);
    useEffect(() => {
        if (PopupRenderer && isPopupOpen) {
            PopupRenderer.openPopup(id, function Popup({ id }) {
                const isPopupOpen = useToolbarStore((store) => !!store.openedPopups[id]);
                useEffect(() => {
                    if (!isPopupOpen) {
                        PopupRenderer.closePopup(id);
                    }
                }, [isPopupOpen]);
                return (_jsx(PopupPresenter, Object.assign({ isOpen: isPopupOpen, onClose: () => closePopup(id), position: position, blocking: true, focusOnRender: true }, presenterProps, { children: _jsx(Box, Object.assign({ sx: {
                            boxShadow: "menu",
                            borderRadius: "default",
                            overflow: "hidden",
                            //          width,
                        } }, { children: _jsx(EditorContext.Consumer, { children: () => {
                                return renderPopup(() => PopupRenderer.closePopup(id));
                            } }) })) }), id));
            });
        }
    }, [PopupRenderer, isPopupOpen]);
    return null;
}
export function usePopupHandler(options) {
    let { autoCloseOnUnmount, group, isOpen, id, onClosed, onClosePopup } = options;
    const isPopupOpen = useToolbarStore((store) => !!store.openedPopups[id]);
    const openPopup = useToolbarStore((store) => store.openPopup);
    const closePopup = useToolbarStore((store) => store.closePopup);
    const closePopupGroup = useToolbarStore((store) => store.closePopupGroup);
    const isBottom = useToolbarStore((store) => store.toolbarLocation === "bottom");
    if (isBottom)
        group = "popup";
    useEffect(() => {
        if (isOpen)
            openPopup({ id, group });
        else
            closePopup(id);
    }, [isOpen, id, group, openPopup, closePopup]);
    useEffect(() => {
        if (!autoCloseOnUnmount)
            return;
        return () => {
            onClosePopup === null || onClosePopup === void 0 ? void 0 : onClosePopup();
        };
    }, [autoCloseOnUnmount, onClosePopup]);
    useEffect(() => {
        if (!isPopupOpen)
            onClosed === null || onClosed === void 0 ? void 0 : onClosed();
    }, [isPopupOpen]);
    useEffect(() => {
        if (isPopupOpen) {
            closePopupGroup(group, [id]);
        }
    }, [onClosed, isPopupOpen, closePopupGroup, id, group]);
    useEffect(() => {
        if (!isOpen)
            closePopup(id);
    }, [isOpen, id, group, closePopup]);
    return { isPopupOpen, closePopup };
}
export function showPopup(options) {
    const { popup } = options, props = __rest(options, ["popup"]);
    function hide() {
        ReactDOM.unmountComponentAtNode(getPopupContainer());
    }
    ReactDOM.render(_jsx(ThemeProvider, { children: _jsx(ResponsivePresenter, Object.assign({ isOpen: true, onClose: hide, position: {
                target: getToolbarElement(),
                isTargetAbsolute: true,
                location: "below",
                align: "end",
                yOffset: 10,
            }, blocking: true, focusOnRender: true }, props, { children: popup(hide) })) }), getPopupContainer());
    return hide;
}
