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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from "react";
import { Flex } from "rebass";
import { Icons } from "../icons";
import { Icon } from "./icon";
import { ToolButton } from "./tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import Button from "../../components/button";
export function SplitButton(props) {
    var children = props.children, toggled = props.toggled, onOpen = props.onOpen, toolButtonProps = __rest(props, ["children", "toggled", "onOpen"]);
    var ref = useRef(null);
    var toolbarLocation = useToolbarLocation();
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, __assign({ ref: ref, sx: {
                    borderRadius: "default",
                    bg: toggled ? "hover" : "transparent",
                    ":hover": { bg: "hover" },
                } }, { children: [_jsx(ToolButton, __assign({}, toolButtonProps, { toggled: toggled })), _jsx(Button, __assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: toggled ? "hover" : "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: onOpen }, { children: _jsx(Icon, { path: toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown, color: "text", size: "small" }) }))] })), children] }));
}
