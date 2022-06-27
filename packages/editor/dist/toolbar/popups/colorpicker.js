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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { useCallback, useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Button } from "../../components/button";
import { debounce } from "../../utils/debounce";
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
var PALETTE_SIZE = [35, 35, 25];
export function ColorPicker(props) {
    var _a = props.colors, colors = _a === void 0 ? DEFAULT_COLORS : _a, color = props.color, onClear = props.onClear, onChange = props.onChange, title = props.title, onClose = props.onClose, expanded = props.expanded;
    var ref = useRef();
    var _b = __read(useState(expanded || false), 2), isPickerOpen = _b[0], setIsPickerOpen = _b[1];
    var _c = __read(useState(tinycolor(color || colors[0]).toHexString()), 2), currentColor = _c[0], setCurrentColor = _c[1];
    var tColor = tinycolor(currentColor);
    useEffect(function () {
        if (!ref.current)
            return;
        if (isPickerOpen)
            ref.current.focus({ preventScroll: true });
    }, [isPickerOpen]);
    var onColorChange = useCallback(debounce(function (color) {
        onChange(color);
    }, 500), [onChange]);
    return (_jsxs(Flex, __assign({ ref: ref, tabIndex: -1, sx: {
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
        } }, { children: [onClose && (_jsxs(Box, __assign({ sx: {
                    display: ["none", "flex"],
                    justifyContent: "space-between",
                    p: 2,
                    pb: isPickerOpen ? 2 : 0,
                    //pb: 0,
                    alignItems: "center",
                }, onClick: onClose }, { children: [_jsx(Text, __assign({ variant: "title" }, { children: title })), _jsx(Button, __assign({ variant: "icon", sx: { p: 0 } }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) }))] }))), isPickerOpen ? (_jsxs(_Fragment, { children: [_jsx(HexColorPicker, { onChange: function (color) {
                            setCurrentColor(color);
                            onColorChange(color);
                        }, onTouchEnd: function () { return onChange(currentColor); }, onMouseUp: function () { return onChange(currentColor); } }), _jsx(Input, { variant: "clean", placeholder: "#000000", spellCheck: false, sx: {
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
                            if (tinycolor(value, { format: "hex" }).isValid()) {
                                setCurrentColor(value);
                                onChange(value);
                            }
                        } })] })) : null, _jsxs(Flex, { children: [_jsxs(Flex, __assign({ className: "hide-scrollbar", sx: {
                            flex: 1,
                            p: 1,
                            overflowX: ["auto", "hidden"],
                            flexWrap: ["nowrap", "wrap"],
                        } }, { children: [_jsx(Button, __assign({ variant: "icon", sx: {
                                    flexShrink: 0,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: onClear }, { children: _jsx(Icon, { path: Icons.colorClear, color: "text", size: 15 }) })), _jsx(Button, __assign({ variant: "secondary", sx: {
                                    flexShrink: 0,
                                    bg: currentColor,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    // boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: function () { return setIsPickerOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.palette, color: tColor.isDark() ? "static" : "icon", size: 18 }) })), colors.map(function (color) { return (_jsx(Button, { variant: "secondary", sx: {
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
                                } }, color)); })] })), onClose && (_jsx(Button, __assign({ variant: "icon", sx: { display: ["block", "none"], px: 2 }, onClick: onClose, onTouchStart: function (e) { return e.preventDefault(); }, onTouchEnd: function (e) {
                            e.preventDefault();
                            onClose();
                        } }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) })))] })] })));
}
