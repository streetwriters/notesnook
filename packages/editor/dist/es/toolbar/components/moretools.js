import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { PopupWrapper } from "../../components/popup-presenter";
import { ToolButton } from "../components/tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { ToolbarGroup } from "./toolbar-group";
export function MoreTools(props) {
    const { popupId, editor, tools, autoCloseOnUnmount } = props;
    const toolbarLocation = useToolbarLocation();
    const isBottom = toolbarLocation === "bottom";
    const buttonRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({}, props, { toggled: isOpen, buttonRef: buttonRef, onClick: () => setIsOpen((s) => !s) })), _jsx(PopupWrapper, { isOpen: isOpen, group: "toolbarGroup", id: popupId, onClosed: () => setIsOpen(false), position: {
                    isTargetAbsolute: true,
                    target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
                    align: "center",
                    location: isBottom ? "top" : "below",
                    yOffset: isBottom ? 10 : 5,
                }, autoCloseOnUnmount: autoCloseOnUnmount, focusOnRender: false, blocking: false, renderPopup: () => (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                        flex: 1,
                        // this is intentionally set to a fixed value
                        // because we want the same padding on mobile
                        // and web.
                        p: "5px",
                        boxShadow: "menu",
                        bg: "background",
                        borderRadius: "default",
                        overflowX: "auto",
                        maxWidth: "95vw",
                    } })) })] }));
}
