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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorPicker = exports.DEFAULT_COLORS = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var forms_1 = require("@rebass/forms");
var icon_1 = require("../components/icon");
var icons_1 = require("../icons");
var react_1 = require("react");
var tinycolor2_1 = __importDefault(require("tinycolor2"));
var react_colorful_1 = require("react-colorful");
var button_1 = require("../../components/button");
var debounce_1 = require("../../utils/debounce");
exports.DEFAULT_COLORS = [
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#f44336",
];
var PALETTE_SIZE = [35, 35, 25];
function ColorPicker(props) {
    var _a = props.colors, colors = _a === void 0 ? exports.DEFAULT_COLORS : _a, color = props.color, onClear = props.onClear, onChange = props.onChange, title = props.title, onClose = props.onClose, expanded = props.expanded;
    var ref = (0, react_1.useRef)();
    var _b = __read((0, react_1.useState)(expanded || false), 2), isPickerOpen = _b[0], setIsPickerOpen = _b[1];
    var _c = __read((0, react_1.useState)((0, tinycolor2_1.default)(color || colors[0]).toHexString()), 2), currentColor = _c[0], setCurrentColor = _c[1];
    var tColor = (0, tinycolor2_1.default)(currentColor);
    (0, react_1.useEffect)(function () {
        if (!ref.current)
            return;
        if (isPickerOpen)
            ref.current.focus({ preventScroll: true });
    }, [isPickerOpen]);
    var onColorChange = (0, react_1.useCallback)((0, debounce_1.debounce)(function (color) {
        onChange(color);
    }, 500), [onChange]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ ref: ref, tabIndex: -1, sx: {
            bg: "background",
            flexDirection: "column",
            ".react-colorful": {
                width: "auto",
                height: 150,
            },
            ".react-colorful__saturation": {
                borderRadius: ["default", 0],
            },
            width: ["calc(100vw - 20px)", 250],
            //  width: ["auto", 250],
        } }, { children: [onClose && ((0, jsx_runtime_1.jsxs)(rebass_1.Box, __assign({ sx: {
                    display: ["none", "flex"],
                    justifyContent: "space-between",
                    p: 2,
                    pb: isPickerOpen ? 2 : 0,
                    //pb: 0,
                    alignItems: "center",
                }, onClick: onClose }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "title" }, { children: title })), (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "icon", sx: { p: 0 } }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) }))] }))), isPickerOpen ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_colorful_1.HexColorPicker, { onChange: function (color) {
                            setCurrentColor(color);
                            onColorChange(color);
                        }, onTouchEnd: function () { return onChange(currentColor); }, onMouseUp: function () { return onChange(currentColor); } }), (0, jsx_runtime_1.jsx)(forms_1.Input, { variant: "clean", placeholder: "#000000", spellCheck: false, sx: {
                            my: 2,
                            p: 0,
                            borderRadius: 0,
                            fontSize: ["title", "title", "body"],
                            color: "fontTertiary",
                            textAlign: "center",
                            letterSpacing: 1.5,
                        }, value: currentColor.toUpperCase(), maxLength: 7, onChange: function (e) {
                            var value = e.target.value;
                            if (!value)
                                return;
                            if ((0, tinycolor2_1.default)(value, { format: "hex" }).isValid()) {
                                setCurrentColor(value);
                                onChange(value);
                            }
                        } })] })) : null, (0, jsx_runtime_1.jsxs)(rebass_1.Flex, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ className: "hide-scrollbar", sx: {
                            flex: 1,
                            p: 1,
                            overflowX: ["auto", "hidden"],
                            flexWrap: ["nowrap", "wrap"],
                        } }, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "icon", sx: {
                                    flexShrink: 0,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: onClear }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.colorClear, color: "text", size: 15 }) })), (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "secondary", sx: {
                                    flexShrink: 0,
                                    bg: currentColor,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    // boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: function () { return setIsPickerOpen(function (s) { return !s; }); } }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.palette, color: tColor.isDark() ? "static" : "icon", size: 18 }) })), colors.map(function (color) { return ((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", sx: {
                                    flex: "0 0 auto",
                                    bg: color,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    ml: [2, 1, 1],
                                    mb: [0, 1, 1],
                                    borderRadius: 50,
                                    //   boxShadow: "menu",
                                }, onClick: function () {
                                    setCurrentColor(color);
                                    onChange(color);
                                } }, color)); })] })), onClose && ((0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "icon", sx: { display: ["block", "none"], px: 2 }, onClick: onClose }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) })))] })] })));
}
exports.ColorPicker = ColorPicker;
