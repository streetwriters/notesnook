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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { config } from "../../utils/config";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
// TODO test rerendering
function _ColorTool(props) {
    var editor = props.editor, onColorChange = props.onColorChange, getActiveColor = props.getActiveColor, title = props.title, cacheKey = props.cacheKey, toolProps = __rest(props, ["editor", "onColorChange", "getActiveColor", "title", "cacheKey"]);
    var activeColor = getActiveColor() || config.get(cacheKey);
    var tColor = tinycolor(activeColor);
    var isBottom = useToolbarLocation() === "bottom";
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    return (_jsx(SplitButton, __assign({}, toolProps, { iconColor: activeColor && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: activeColor || "transparent",
            ":hover": {
                bg: activeColor ? tColor.darken(5).toRgbString() : "transparent",
            },
        }, onOpen: function () { return setIsOpen(function (s) { return !s; }); }, toggled: isOpen, onClick: function () { return onColorChange(activeColor); } }, { children: _jsx(PopupWrapper, { isOpen: isOpen, id: props.icon, group: "color", position: {
                isTargetAbsolute: true,
                target: getToolbarElement(),
                align: isBottom ? "center" : "end",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, focusOnRender: false, blocking: false, renderPopup: function (close) { return (_jsx(ColorPicker, { color: activeColor, onClear: function () {
                    onColorChange();
                    config.set(cacheKey, null);
                }, onChange: function (color) {
                    onColorChange(color);
                    config.set(cacheKey, color);
                }, onClose: close, title: title })); } }) })));
}
export var ColorTool = React.memo(_ColorTool, function () { return true; });
export function Highlight(props) {
    var editor = props.editor;
    return (_jsx(ColorTool, __assign({}, props, { cacheKey: "highlight", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("highlight").color; }, title: "Background color", onColorChange: function (color) {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleHighlight({ color: color }).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetHighlight().run();
        } })));
}
export function TextColor(props) {
    var editor = props.editor;
    return (_jsx(ColorTool, __assign({}, props, { cacheKey: "textColor", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("textStyle").color; }, title: "Text color", onColorChange: function (color) {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setColor(color).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetColor().run();
        } })));
}
