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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { PopupWrapper } from "../../components/popup-presenter";
import { ToolButton } from "../components/tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { ToolbarGroup } from "./toolbar-group";
export function MoreTools(props) {
    var popupId = props.popupId, editor = props.editor, tools = props.tools, autoCloseOnUnmount = props.autoCloseOnUnmount;
    var toolbarLocation = useToolbarLocation();
    var isBottom = toolbarLocation === "bottom";
    var buttonRef = useRef();
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({}, props, { toggled: isOpen, buttonRef: buttonRef, onMouseDown: function (e) { return e.preventDefault(); }, onClick: function () { return setIsOpen(function (s) { return !s; }); } })), _jsx(PopupWrapper, { isOpen: isOpen, group: "toolbarGroup", id: popupId, onClosed: function () { return setIsOpen(false); }, position: {
                    isTargetAbsolute: true,
                    target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
                    align: "center",
                    location: isBottom ? "top" : "below",
                    yOffset: isBottom ? 10 : 5,
                }, autoCloseOnUnmount: autoCloseOnUnmount, focusOnRender: false, blocking: false, renderPopup: function () { return (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                        flex: 1,
                        p: 1,
                        // TODO: we cannot put a fix height here
                        // since it differs from platform to platform.
                        // perhaps we can use a expose a custom css class
                        // or extend the theme.
                        // px: isBottom ? 0 : 1,
                        // height: "50px",
                        boxShadow: "menu",
                        bg: "background",
                        borderRadius: "default",
                        overflowX: "auto",
                        maxWidth: "95vw",
                    } })); } })] }));
}
