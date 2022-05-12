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
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
import { Box, Button } from "rebass";
var defaultFontSizes = [
    8, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
];
export function FontSize(props) {
    var editor = props.editor;
    var currentFontSize = defaultFontSizes.find(function (size) {
        return editor.isActive("textStyle", { fontSize: "".concat(size, "px") });
    }) || 16;
    return (_jsx(Dropdown, { selectedItem: "".concat(currentFontSize, "px"), items: [
            {
                key: "font-sizes",
                type: "menuitem",
                component: function () { return (_jsx(Box, __assign({ sx: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)" } }, { children: defaultFontSizes.map(function (size) { return (_jsxs(Button, __assign({ variant: "menuitem" }, { children: [size, "px"] }))); }) }))); },
            },
        ], 
        // items={defaultFontSizes.map((size) => ({
        //   key: `${size}px`,
        //   type: "menuitem",
        //   title: `${size}px`,
        //   isChecked: size === currentFontSize,
        //   onClick: () => editor.chain().focus().setFontSize(`${size}px`).run(),
        // }))}
        menuWidth: 100 }));
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
