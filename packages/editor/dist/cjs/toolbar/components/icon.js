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
exports.Icon = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("@mdi/react"));
const rebass_1 = require("rebass");
const emotion_theming_1 = require("emotion-theming");
function MDIIconWrapper({ title, path, size = 24, color = "icon", stroke, rotate, }) {
    const theme = (0, emotion_theming_1.useTheme)();
    const themedColor = (theme === null || theme === void 0 ? void 0 : theme.colors)
        ? theme.colors[color]
        : color;
    return ((0, jsx_runtime_1.jsx)(react_1.default, { className: "icon", title: title, path: path, size: typeof size === "string"
            ? `${(theme === null || theme === void 0 ? void 0 : theme.iconSizes[size]) || 24}px`
            : `${size}px`, style: {
            strokeWidth: stroke || "0px",
            stroke: themedColor,
        }, color: themedColor, spin: rotate }));
}
function Icon(props) {
    const { sx, title, color, size, stroke, rotate, path } = props, restProps = __rest(props, ["sx", "title", "color", "size", "stroke", "rotate", "path"]);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: Object.assign({ flexShrink: 0, justifyContent: "center", alignItems: "center" }, sx) }, restProps, { children: (0, jsx_runtime_1.jsx)(MDIIconWrapper, { title: title, path: path, rotate: rotate, color: color, stroke: stroke, size: size }) })));
}
exports.Icon = Icon;
