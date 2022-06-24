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
import React from "react";
import { Icons } from "../icons";
import { Button } from "../../components/button";
import { Icon } from "./icon";
export var ToolButton = React.memo(function ToolButton(props) {
    var id = props.id, icon = props.icon, iconSize = props.iconSize, iconColor = props.iconColor, toggled = props.toggled, sx = props.sx, buttonRef = props.buttonRef, _a = props.variant, variant = _a === void 0 ? "normal" : _a, buttonProps = __rest(props, ["id", "icon", "iconSize", "iconColor", "toggled", "sx", "buttonRef", "variant"]);
    console.log("rerendering", props.title);
    return (_jsx(Button, __assign({ ref: buttonRef, tabIndex: -1, id: "tool-".concat(id || icon), sx: __assign({ flexShrink: 0, p: variant === "small" ? "small" : 1, borderRadius: variant === "small" ? "small" : "default", m: 0, bg: toggled ? "hover" : "transparent", mr: variant === "small" ? 0 : 1, ":hover": { bg: ["transparent", "hover"] }, ":active": { bg: "hover" }, ":last-of-type": {
                mr: 0,
            } }, sx), onMouseDown: function (e) { return e.preventDefault(); } }, buttonProps, { children: _jsx(Icon, { path: Icons[icon], color: iconColor || "icon", size: iconSize || (variant === "small" ? "medium" : "big") }) })));
}, function (prev, next) {
    return prev.toggled === next.toggled;
});
