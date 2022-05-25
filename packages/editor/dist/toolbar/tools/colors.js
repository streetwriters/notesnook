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
import { Box, Button, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { SplitButton } from "../components/split-button";
import { useState } from "react";
import tinycolor from "tinycolor2";
export var DEFAULT_COLORS = [
    "#f44336",
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
];
function ColorTool(props) {
    var editor = props.editor, onColorChange = props.onColorChange, isActive = props.isActive, getActiveColor = props.getActiveColor, toolProps = __rest(props, ["editor", "onColorChange", "isActive", "getActiveColor"]);
    var activeColor = getActiveColor(editor);
    var _isActive = isActive(editor);
    return (_jsx(SplitButton, __assign({}, toolProps, { toggled: false, sx: {
            mr: 0,
            bg: _isActive ? activeColor : "transparent",
        } }, { children: _jsx(Flex, __assign({ sx: {
                flexDirection: "column",
                bg: "background",
                boxShadow: "menu",
                border: "1px solid var(--border)",
                borderRadius: "default",
                p: 1,
                width: 160,
            } }, { children: _jsx(ColorPicker, { colors: DEFAULT_COLORS, color: activeColor, onClear: function () { return onColorChange(editor); }, onChange: function (color) { return onColorChange(editor, color); } }) })) })));
}
export function Highlight(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) { return editor.isActive("highlight", { color: /\W+/gm }); }, getActiveColor: function (editor) { return editor.getAttributes("highlight").color; }, onColorChange: function (editor, color) {
            return color
                ? editor.chain().focus().toggleHighlight({ color: color }).run()
                : editor.chain().focus().unsetHighlight().run();
        } })));
}
export function TextColor(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) { return editor.isActive("textStyle", { color: /\W+/gm }); }, getActiveColor: function (editor) { return editor.getAttributes("textStyle").color; }, onColorChange: function (editor, color) {
            return color
                ? editor.chain().focus().setColor(color).run()
                : editor.chain().focus().unsetColor().run();
        } })));
}
export function ColorPicker(props) {
    var colors = props.colors, color = props.color, onClear = props.onClear, onChange = props.onChange;
    var _a = __read(useState(tinycolor(color || colors[0]).toHexString()), 2), currentColor = _a[0], setCurrentColor = _a[1];
    return (_jsxs(_Fragment, { children: [_jsx(Flex, __assign({ sx: {
                    width: "100%",
                    height: 50,
                    bg: currentColor,
                    mb: 1,
                    borderRadius: "default",
                    alignItems: "center",
                    justifyContent: "center",
                } }, { children: _jsx(Text, __assign({ sx: {
                        fontSize: "subheading",
                        color: tinycolor(currentColor).isDark() ? "white" : "black",
                    } }, { children: currentColor })) })), _jsxs(Box, __assign({ sx: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                } }, { children: [colors.map(function (color) { return (_jsx(Box, { sx: {
                            bg: color,
                            width: 25,
                            height: 25,
                            m: "small",
                            borderRadius: "default",
                            cursor: "pointer",
                            ":hover": {
                                filter: "brightness(85%)",
                            },
                        }, onClick: function () {
                            setCurrentColor(color);
                            onChange(color);
                        } })); }), _jsx(Flex, __assign({ sx: {
                            width: 25,
                            height: 25,
                            m: "small",
                            borderRadius: "small",
                            cursor: "pointer",
                            alignItems: "center",
                            justifyContent: "center",
                            ":hover": {
                                filter: "brightness(85%)",
                            },
                        }, onClick: onClear }, { children: _jsx(Icon, { path: Icons.colorClear, size: 18 }) }))] })), _jsxs(Flex, __assign({ sx: {
                    mt: 1,
                    borderRadius: "default",
                } }, { children: [_jsx(Input, { placeholder: "#000000", sx: {
                            p: 1,
                            m: 0,
                            fontSize: "body",
                            border: "none",
                            borderWidth: 0,
                        }, value: currentColor, maxLength: 7, onChange: function (e) {
                            var value = e.target.value;
                            if (!value)
                                return;
                            setCurrentColor(value);
                        } }), _jsx(Button, __assign({ sx: {
                            bg: "transparent",
                            p: 1,
                            ":hover": { bg: "hover" },
                            cursor: "pointer",
                        }, onClick: function () { return onChange(currentColor); } }, { children: _jsx(Icon, { path: Icons.check, color: "text", size: 18 }) }))] }))] }));
}
