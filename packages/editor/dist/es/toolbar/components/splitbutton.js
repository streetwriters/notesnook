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
import { Button } from "../../components/button";
import React from "react";
function _SplitButton(props) {
    const { children, toggled, onOpen } = props, toolButtonProps = __rest(props, ["children", "toggled", "onOpen"]);
    const ref = useRef(null);
    const toolbarLocation = useToolbarLocation();
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, Object.assign({ ref: ref, sx: {
                    borderRadius: "default",
                    bg: toggled ? "hover" : "transparent",
                    ":hover": { bg: [toggled ? "hover" : "transparent", "hover"] },
                    ":active": { bg: toggled ? "hover" : "transparent" },
                } }, { children: [_jsx(ToolButton, Object.assign({}, toolButtonProps, { toggled: false })), _jsx(Button, Object.assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: onOpen }, { children: _jsx(Icon, { path: toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown, color: "text", size: "small" }) }))] })), children] }));
}
export const SplitButton = React.memo(_SplitButton, (prev, next) => {
    return prev.toggled === next.toggled;
});
