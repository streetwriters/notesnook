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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { Button, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { MenuPresenter } from "../../components/menu/menu";
import { useToolbarContext } from "../hooks/useToolbarContext";
export function Dropdown(props) {
    var items = props.items, selectedItem = props.selectedItem, buttonRef = props.buttonRef, menuWidth = props.menuWidth;
    var internalRef = useRef();
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var toolbarLocation = useToolbarContext().toolbarLocation;
    return (_jsxs(_Fragment, { children: [_jsxs(Button, __assign({ ref: function (ref) {
                    internalRef.current = ref;
                    if (buttonRef)
                        buttonRef.current = ref;
                }, sx: {
                    p: 1,
                    m: 0,
                    bg: isOpen ? "hover" : "transparent",
                    mr: 1,
                    display: "flex",
                    alignItems: "center",
                    ":hover": { bg: "hover" },
                    ":last-of-type": {
                        mr: 0,
                    },
                }, onClick: function () { return setIsOpen(function (s) { return !s; }); }, onMouseDown: function (e) { return e.preventDefault(); } }, { children: [typeof selectedItem === "string" ? (_jsx(Text, __assign({ sx: { fontSize: 12, mr: 1, color: "text" } }, { children: selectedItem }))) : (selectedItem), _jsx(Icon, { path: toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown, size: 14, color: "text" })] })), _jsx(MenuPresenter, { options: {
                    type: "menu",
                    position: {
                        target: internalRef.current || undefined,
                        isTargetAbsolute: true,
                        location: toolbarLocation === "bottom" ? "top" : "below",
                        yOffset: 5,
                    },
                }, isOpen: isOpen, items: items, onClose: function () { return setIsOpen(false); }, sx: { minWidth: menuWidth } })] }));
}
