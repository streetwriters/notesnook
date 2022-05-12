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
import { Button, Flex } from "rebass";
import { Icons } from "../icons";
import { Icon } from "./icon";
import { ToolButton } from "./tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useToolbarLocation } from "../stores/toolbar-store";
export function SplitButton(props) {
    var menuPresenterProps = props.menuPresenterProps, children = props.children, toolButtonProps = __rest(props, ["menuPresenterProps", "children"]);
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var ref = useRef(null);
    var toolbarLocation = useToolbarLocation();
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, __assign({ ref: ref, sx: {
                    borderRadius: "default",
                    bg: isOpen ? "hover" : "transparent",
                    ":hover": { bg: "hover" },
                } }, { children: [_jsx(ToolButton, __assign({}, toolButtonProps)), _jsx(Button, __assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: function () { return setIsOpen(function (s) { return !s; }); }, onMouseDown: function (e) { return e.preventDefault(); } }, { children: _jsx(Icon, { path: toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown, color: "text", size: 14 }) }))] })), _jsx(MenuPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, options: {
                    type: "menu",
                    position: {
                        target: ref.current || undefined,
                        isTargetAbsolute: true,
                        location: toolbarLocation === "bottom" ? "top" : "below",
                        yOffset: 5,
                        align: "center",
                    },
                }, items: [] }, menuPresenterProps, { children: children }))] }));
}
