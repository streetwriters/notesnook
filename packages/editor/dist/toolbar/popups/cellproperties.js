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
import { Slider } from "@rebass/forms";
import { useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
export function CellProperties(props) {
    var editor = props.editor, onClose = props.onClose;
    var attributes = editor.getAttributes("tableCell");
    return (_jsx(Popup, __assign({ title: "Cell properties", action: {
            icon: "close",
            iconColor: "error",
            onClick: onClose,
        } }, { children: _jsxs(Flex, __assign({ sx: { flexDirection: "column", px: 1, mb: 2 } }, { children: [_jsx(ColorPickerTool, { color: attributes.backgroundColor, title: "Background color", icon: "backgroundColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("backgroundColor", color);
                    } }), _jsx(ColorPickerTool, { color: attributes.color, title: "Text color", icon: "textColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("color", color);
                    } }), _jsx(ColorPickerTool, { color: attributes.borderColor, title: "Border color", icon: "borderColor", onColorChange: function (color) {
                        return editor.commands.setCellAttribute("borderColor", color);
                    } }), _jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ sx: {
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 1,
                            } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: "Border width" })), _jsxs(Text, __assign({ variant: "body" }, { children: [attributes.borderWidth || 1, "px"] }))] })), _jsx(Slider, { min: 1, max: 5, value: attributes.borderWidth || 1, onChange: function (e) {
                                editor.commands.setCellAttribute("borderWidth", e.target.valueAsNumber);
                            } })] }))] })) })));
}
function ColorPickerTool(props) {
    var color = props.color, title = props.title, icon = props.icon, onColorChange = props.onColorChange;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef(null);
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center", mt: 1 } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: title })), _jsx(ToolButton, { buttonRef: buttonRef, toggled: isOpen, title: title, id: icon, icon: icon, iconSize: 16, sx: {
                            p: "2.5px",
                            borderRadius: "small",
                            backgroundColor: color || "transparent",
                            ":hover": { bg: color, filter: "brightness(90%)" },
                        }, onClick: function () { return setIsOpen(true); } })] })), _jsx(MenuPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [], options: {
                    type: "menu",
                    position: {
                        target: buttonRef.current || undefined,
                        location: "below",
                        align: "center",
                        isTargetAbsolute: true,
                        yOffset: 5,
                    },
                } }, { children: _jsx(Flex, { sx: {
                        flexDirection: "column",
                        bg: "background",
                        boxShadow: "menu",
                        border: "1px solid var(--border)",
                        borderRadius: "default",
                        p: 1,
                        width: 160,
                    } }) }))] }));
}
