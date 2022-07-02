"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const icons_1 = require("../icons");
const button_1 = require("../../components/button");
const icon_1 = require("./icon");
exports.ToolButton = react_1.default.memo(function ToolButton(props) {
    const { id, icon, iconSize, iconColor, toggled, sx, buttonRef, variant = "normal" } = props, buttonProps = __rest(props, ["id", "icon", "iconSize", "iconColor", "toggled", "sx", "buttonRef", "variant"]);
    return ((0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ ref: buttonRef, tabIndex: -1, id: `tool-${id || icon}`, sx: Object.assign({ flexShrink: 0, p: variant === "small" ? "small" : 1, borderRadius: variant === "small" ? "small" : "default", m: 0, bg: toggled ? "hover" : "transparent", mr: variant === "small" ? 0 : 1, ":hover": { bg: ["transparent", "hover"] }, ":active": { bg: "hover" }, ":last-of-type": {
                mr: 0,
            } }, sx), onMouseDown: (e) => e.preventDefault() }, buttonProps, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons[icon], color: iconColor || "icon", size: iconSize || (variant === "small" ? "medium" : "big") }) })));
}, (prev, next) => {
    return prev.toggled === next.toggled && prev.icon === next.icon;
});
