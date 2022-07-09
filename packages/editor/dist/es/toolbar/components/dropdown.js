import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { useIsMobile, useToolbarLocation, } from "../stores/toolbar-store";
import { MenuPresenter } from "../../components/menu";
import { getToolbarElement } from "../utils/dom";
import { Button } from "../../components/button";
import { usePopupHandler } from "../../components/popup-presenter";
export function Dropdown(props) {
    let { id, group, items, selectedItem, buttonRef, menuWidth } = props;
    const internalRef = useRef();
    const [isOpen, setIsOpen] = useState(false);
    const toolbarLocation = useToolbarLocation();
    const isMobile = useIsMobile();
    const isBottom = toolbarLocation === "bottom";
    const { closePopup, isPopupOpen } = usePopupHandler({
        group,
        id,
        isOpen,
        onClosed: () => setIsOpen(false),
    });
    return (_jsxs(_Fragment, { children: [_jsxs(Button, Object.assign({ ref: (ref) => {
                    internalRef.current = ref;
                    if (buttonRef)
                        buttonRef.current = ref || undefined;
                }, sx: {
                    p: 1,
                    m: 0,
                    bg: isPopupOpen ? "hover" : "transparent",
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    ":hover": { bg: "hover" },
                    ":last-of-type": {
                        mr: 0,
                    },
                }, onClick: () => setIsOpen((s) => !s), onMouseDown: (e) => e.preventDefault() }, { children: [typeof selectedItem === "string" ? (_jsx(Text, Object.assign({ sx: { fontSize: "subBody", mr: 1, color: "text" } }, { children: selectedItem }))) : (selectedItem), _jsx(Icon, { path: isBottom ? Icons.chevronUp : Icons.chevronDown, size: "small", color: "text" })] })), _jsx(MenuPresenter, { isOpen: isPopupOpen, items: items, onClose: () => closePopup(id), position: {
                    target: isBottom
                        ? getToolbarElement()
                        : internalRef.current || "mouse",
                    isTargetAbsolute: true,
                    location: isBottom ? "top" : "below",
                    align: "center",
                    yOffset: 5,
                }, blocking: !isMobile, focusOnRender: !isMobile, sx: {
                    minWidth: menuWidth,
                    maxWidth: isBottom ? "95vw" : "auto",
                    flexDirection: isBottom ? "row" : "column",
                    overflowX: isBottom ? "auto" : "hidden",
                    marginRight: isBottom ? "10px" : 0,
                    display: "flex",
                    alignItems: isBottom ? "center" : "unset",
                    mr: isBottom ? 0 : 2,
                } })] }));
}
