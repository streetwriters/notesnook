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
import { Dropdown } from "../components/dropdown";
var defaultFontSizes = [
    12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
];
export function FontSize(props) {
    var editor = props.editor;
    var currentFontSize = defaultFontSizes.find(function (size) {
        return editor.isActive("textStyle", { fontSize: "".concat(size, "px") });
    }) || 16;
    return (_jsx(Dropdown, { selectedItem: "".concat(currentFontSize, "px"), items: defaultFontSizes.map(function (size) { return ({
            key: "".concat(size, "px"),
            type: "menuitem",
            title: "".concat(size, "px"),
            isChecked: size === currentFontSize,
            onClick: function () { return editor.chain().focus().setFontSize("".concat(size, "px")).run(); },
        }); }), menuWidth: 100 }));
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
