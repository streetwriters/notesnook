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
import { useRef, useState } from "react";
import { Box, Flex, Text } from "rebass";
import { Tab, Tabs } from "../../components/tabs";
import { Icon } from "../components/icon";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
import { Icons } from "../icons";
import { ColorPicker } from "./color-picker";
export function CellProperties(props) {
    var editor = props.editor, onClose = props.onClose;
    var attributes = editor.getAttributes("tableCell");
    return (_jsx(Popup, __assign({ title: "Cell properties", onClose: onClose }, { children: _jsxs(Tabs, __assign({ activeIndex: 0 }, { children: [_jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell background color", path: Icons.backgroundColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.backgroundColor, onChange: function (color) {
                                return editor.commands.setCellAttribute("backgroundColor", color);
                            }, onClear: function () {
                                return editor.commands.setCellAttribute("backgroundColor", undefined);
                            } })] })), _jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell text color", path: Icons.textColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.color, onChange: function (color) {
                                return editor.commands.setCellAttribute("color", color);
                            }, onClear: function () { return editor.commands.setCellAttribute("color", undefined); } })] })), _jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell border color", path: Icons.cellBorderColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.borderColor, onChange: function (color) {
                                return editor.commands.setCellAttribute("borderColor", color);
                            }, onClear: function () {
                                return editor.commands.setCellAttribute("borderColor", undefined);
                            } })] }))] })) })));
}
function ColorPickerTool(props) {
    var color = props.color, title = props.title, icon = props.icon, onColorChange = props.onColorChange;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef(null);
    return (_jsx(_Fragment, { children: _jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center", mt: 1 } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: title })), _jsx(ToolButton, { buttonRef: buttonRef, toggled: isOpen, title: title, id: icon, icon: icon, variant: "small", sx: {
                        borderRadius: "small",
                        backgroundColor: color || "transparent",
                        ":hover": { bg: color, filter: "brightness(90%)" },
                    }, onClick: function () { return setIsOpen(true); } })] })) }));
}
