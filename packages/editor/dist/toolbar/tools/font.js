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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
import { Flex, Text } from "rebass";
import { ToolButton } from "../components/tool-button";
import { useCallback } from "react";
var defaultFontSizes = [
    8, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
];
export function FontSize(props) {
    var editor = props.editor;
    var _a = editor.getAttributes("textStyle").fontSize, fontSize = _a === void 0 ? "16px" : _a;
    var fontSizeAsNumber = parseInt(fontSize.replace("px", ""));
    var decreaseFontSize = useCallback(function () {
        return Math.max(8, fontSizeAsNumber - 1);
    }, [fontSizeAsNumber]);
    return (_jsxs(Flex, __assign({ sx: {
            alignItems: "center",
            mr: 1,
            ":last-of-type": {
                mr: 0,
            },
        } }, { children: [_jsx(ToolButton, { toggled: false, title: "Decrease font size", icon: "minus", variant: "small", onClick: function () {
                    editor.chain().focus().setFontSize("".concat(decreaseFontSize(), "px")).run();
                } }), _jsx(Text, __assign({ variant: "body", sx: { fontSize: 12, mx: "3px", textAlign: "center" }, title: "Reset font size", onClick: function () {
                    editor.chain().focus().setFontSize("16px").run();
                } }, { children: fontSize })), _jsx(ToolButton, { toggled: false, title: "Increase font size", icon: "plus", variant: "small", onClick: function () {
                    editor
                        .chain()
                        .focus()
                        .setFontSize("".concat(fontSizeAsNumber + 1, "px"))
                        .run();
                } })] })));
}
var fontFamilies = {
    System: "Open Sans",
    Serif: "serif",
    Monospace: "monospace",
};
export function FontFamily(props) {
    var _a, _b;
    var editor = props.editor;
    var currentFontFamily = ((_b = (_a = Object.entries(fontFamilies)
        .find(function (_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        return editor.isActive("textStyle", { fontFamily: value });
    })) === null || _a === void 0 ? void 0 : _a.map(function (a) { return a; })) === null || _b === void 0 ? void 0 : _b.at(0)) || "System";
    return (_jsx(Dropdown, { selectedItem: currentFontFamily, items: toMenuItems(editor, currentFontFamily), menuWidth: 130 }));
}
function toMenuItems(editor, currentFontFamily) {
    var menuItems = [];
    var _loop_1 = function (key) {
        var value = fontFamilies[key];
        menuItems.push({
            key: key,
            type: "menuitem",
            title: key,
            isChecked: key === currentFontFamily,
            onClick: function () { return editor.chain().focus().setFontFamily(value).run(); },
        });
    };
    for (var key in fontFamilies) {
        _loop_1(key);
    }
    return menuItems;
}
