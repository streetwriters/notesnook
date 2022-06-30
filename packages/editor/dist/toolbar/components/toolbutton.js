"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolButton = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("react"));
var icons_1 = require("../icons");
var button_1 = require("../../components/button");
var icon_1 = require("./icon");
exports.ToolButton = react_1.default.memo(function ToolButton(props) {
    var id = props.id, icon = props.icon, iconSize = props.iconSize, iconColor = props.iconColor, toggled = props.toggled, sx = props.sx, buttonRef = props.buttonRef, _a = props.variant, variant = _a === void 0 ? "normal" : _a, buttonProps = __rest(props, ["id", "icon", "iconSize", "iconColor", "toggled", "sx", "buttonRef", "variant"]);
    return ((0, jsx_runtime_1.jsx)(button_1.Button, __assign({ ref: buttonRef, tabIndex: -1, id: "tool-".concat(id || icon), sx: __assign({ flexShrink: 0, p: variant === "small" ? "small" : 1, borderRadius: variant === "small" ? "small" : "default", m: 0, bg: toggled ? "hover" : "transparent", mr: variant === "small" ? 0 : 1, ":hover": { bg: ["transparent", "hover"] }, ":active": { bg: "hover" }, ":last-of-type": {
                mr: 0,
            } }, sx), onMouseDown: function (e) { return e.preventDefault(); } }, buttonProps, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons[icon], color: iconColor || "icon", size: iconSize || (variant === "small" ? "medium" : "big") }) })));
}, function (prev, next) {
    return prev.toggled === next.toggled;
});
