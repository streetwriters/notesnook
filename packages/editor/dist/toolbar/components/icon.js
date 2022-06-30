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
exports.Icon = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("@mdi/react"));
var emotion_theming_1 = require("emotion-theming");
var rebass_1 = require("rebass");
function MDIIconWrapper(_a) {
    var title = _a.title, path = _a.path, _b = _a.size, size = _b === void 0 ? 24 : _b, _c = _a.color, color = _c === void 0 ? "icon" : _c, stroke = _a.stroke, rotate = _a.rotate;
    var theme = (0, emotion_theming_1.useTheme)();
    var themedColor = theme.colors
        ? theme.colors[color]
        : color;
    return ((0, jsx_runtime_1.jsx)(react_1.default, { className: "icon", title: title, path: path, size: typeof size === "string" ? "".concat(theme.iconSizes[size], "px") : "".concat(size, "px"), style: {
            strokeWidth: stroke || "0px",
            stroke: themedColor,
        }, color: themedColor, spin: rotate }));
}
function Icon(props) {
    var sx = props.sx, title = props.title, color = props.color, size = props.size, stroke = props.stroke, rotate = props.rotate, path = props.path, restProps = __rest(props, ["sx", "title", "color", "size", "stroke", "rotate", "path"]);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ sx: __assign({ flexShrink: 0, justifyContent: "center", alignItems: "center" }, sx) }, restProps, { children: (0, jsx_runtime_1.jsx)(MDIIconWrapper, { title: title, path: path, rotate: rotate, color: color, stroke: stroke, size: size }) })));
}
exports.Icon = Icon;
