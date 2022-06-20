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
import { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { useEditorContext } from "../../components/popup-presenter/popuprenderer";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
export function ColorTool(props) {
    var onColorChange = props.onColorChange, isActive = props.isActive, getActiveColor = props.getActiveColor, title = props.title, toolProps = __rest(props, ["onColorChange", "isActive", "getActiveColor", "title"]);
    var editor = useEditorContext();
    var activeColor = getActiveColor(editor);
    var _isActive = isActive(editor);
    var tColor = tinycolor(activeColor);
    var toolbarLocation = useToolbarLocation();
    var isBottom = toolbarLocation === "bottom";
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    // const { hide, isOpen, show } = usePopup({
    //   id: title,
    //   group: "color",
    //   theme: editor?.storage.theme,
    //   blocking: false,
    //   focusOnRender: false,
    // });
    // console.log("Updating color", editor);
    return (_jsx(SplitButton, __assign({}, toolProps, { iconColor: _isActive && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: _isActive ? activeColor : "transparent",
            ":hover": {
                bg: _isActive && !isBottom
                    ? tColor.darken(5).toRgbString()
                    : "transparent",
            },
        }, onOpen: function () {
            setIsOpen(function (s) { return !s; });
        }, toggled: isOpen }, { children: _jsx(PopupWrapper, { isOpen: isOpen, id: title, group: "color", position: {
                isTargetAbsolute: true,
                target: getToolbarElement(),
                align: isBottom ? "center" : "end",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, focusOnRender: false, blocking: false, renderPopup: function (close) { return (_jsx(ColorPicker, { color: activeColor, onClear: function () { return onColorChange(editor); }, onChange: function (color) { return onColorChange(editor, color); }, onClose: close, title: title })); } }) })));
}
export function Highlight(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) { return editor.isActive("highlight", { color: /\W+/gm }); }, getActiveColor: function (editor) { return editor.getAttributes("highlight").color; }, title: "Background color", onColorChange: function (editor, color) {
            return color
                ? editor.chain().focus().toggleHighlight({ color: color }).run()
                : editor.chain().focus().unsetHighlight().run();
        } })));
}
export function TextColor(props) {
    return (_jsx(ColorTool, __assign({}, props, { isActive: function (editor) { return editor.isActive("textStyle", { color: /\W+/gm }); }, getActiveColor: function (editor) { return editor.getAttributes("textStyle").color; }, title: "Text color", onColorChange: function (editor, color) {
            return color
                ? editor.chain().focus().setColor(color).run()
                : editor.chain().focus().unsetColor().run();
        } })));
}
