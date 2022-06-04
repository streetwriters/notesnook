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
import { Button, Flex } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { SplitButton } from "../components/split-button";
import { useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
export var DEFAULT_COLORS = [
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
function ColorTool(props) {
    var editor = props.editor, onColorChange = props.onColorChange, isActive = props.isActive, getActiveColor = props.getActiveColor, toolProps = __rest(props, ["editor", "onColorChange", "isActive", "getActiveColor"]);
    var activeColor = getActiveColor(editor);
    var _isActive = isActive(editor);
    var tColor = tinycolor(activeColor);
    return (_jsx(SplitButton, __assign({}, toolProps, { toggled: false, iconColor: _isActive && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: _isActive ? activeColor : "transparent",
            ":hover": {
                bg: _isActive ? tColor.darken(5).toRgbString() : "transparent",
            },
        }, popupPresenterProps: {
            mobile: "sheet",
            desktop: "menu",
        } }, { children: _jsx(Flex, __assign({ sx: {
                bg: "background",
                width: ["auto", "auto", 250],
                flexDirection: "column",
                p: [3, 3, 2],
                boxShadow: ["none", "none", "menu"],
                borderRadius: ["none", "none", "dialog"],
                ".react-colorful": {
                    width: "auto",
                    height: 150,
                },
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
var PALETTE_SIZE = [35, 35, 25];
export function ColorPicker(props) {
    var colors = props.colors, color = props.color, onClear = props.onClear, onChange = props.onChange;
    var _a = __read(useState(false), 2), isPickerOpen = _a[0], setIsPickerOpen = _a[1];
    var tColor = tinycolor(color || colors[0]);
    var _b = __read(useState(tColor.toHexString()), 2), currentColor = _b[0], setCurrentColor = _b[1];
    return (_jsxs(_Fragment, { children: [isPickerOpen && (_jsx(HexColorPicker, { color: currentColor, onChange: onChange })), _jsxs(Flex, __assign({ sx: {
                    alignItems: "center",
                    justifyContent: "center",
                    mt: isPickerOpen ? 2 : 0,
                } }, { children: [_jsx(Button, __assign({ variant: "secondary", sx: {
                            flexShrink: 0,
                            bg: currentColor,
                            width: PALETTE_SIZE,
                            height: PALETTE_SIZE,
                            mr: 2,
                            borderRadius: 50,
                            boxShadow: "menu",
                            p: 0,
                        }, onClick: function () { return setIsPickerOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.palette, color: tColor.isDark() ? "static" : "icon", size: 18 }) })), _jsx(Input, { variant: "clean", placeholder: "#000000", spellCheck: false, sx: {
                            p: 0,
                            borderRadius: 0,
                            fontSize: ["title", "title", "body"],
                            color: "fontTertiary",
                            textAlign: "left",
                            letterSpacing: 1.5,
                        }, value: currentColor.toUpperCase(), maxLength: 7, onChange: function (e) {
                            var value = e.target.value;
                            if (!value)
                                return;
                            setCurrentColor(value);
                        } }), _jsx(Button, __assign({ variant: "icon", sx: {
                            flexShrink: 0,
                            bg: "transparent",
                            width: PALETTE_SIZE,
                            height: PALETTE_SIZE,
                            mr: 2,
                            borderRadius: 50,
                            p: 0,
                        }, onClick: onClear }, { children: _jsx(Icon, { path: Icons.colorClear, color: "text", size: 15 }) }))] })), _jsx(Flex, __assign({ sx: {
                    borderTop: "1px solid var(--border)",
                    mt: 2,
                    pt: 4,
                    flexWrap: "wrap",
                } }, { children: colors.map(function (color) { return (_jsx(Button, { variant: "secondary", sx: {
                        bg: color,
                        width: PALETTE_SIZE,
                        height: PALETTE_SIZE,
                        ml: [2, 2, 1],
                        mb: [2, 2, 1],
                        borderRadius: 50,
                        boxShadow: "menu",
                    }, onClick: function () {
                        setCurrentColor(color);
                        onChange(color);
                    } })); }) }))] }));
}
