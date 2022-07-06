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
import React from "react";
import { Icons } from "../icons";
import { Button } from "../../components/button";
import { Icon } from "./icon";
export const ToolButton = React.memo(function ToolButton(props) {
    const { id, icon, iconSize, iconColor, toggled, sx, buttonRef, variant = "normal" } = props, buttonProps = __rest(props, ["id", "icon", "iconSize", "iconColor", "toggled", "sx", "buttonRef", "variant"]);
    return (_jsx(Button, Object.assign({ ref: buttonRef, tabIndex: -1, id: `tool-${id || icon}`, sx: Object.assign({ flexShrink: 0, p: variant === "small" ? "small" : 1, borderRadius: variant === "small" ? "small" : "default", m: 0, bg: toggled ? "hover" : "transparent", mr: variant === "small" ? 0 : 1, ":hover": { bg: "hover" }, ":last-of-type": {
                mr: 0,
            } }, sx), onMouseDown: (e) => e.preventDefault() }, buttonProps, { children: _jsx(Icon, { path: Icons[icon], color: iconColor || "icon", size: iconSize || (variant === "small" ? "medium" : "big") }) })));
}, (prev, next) => {
    return (prev.toggled === next.toggled &&
        prev.icon === next.icon &&
        JSON.stringify(prev.sx) === JSON.stringify(next.sx));
});
