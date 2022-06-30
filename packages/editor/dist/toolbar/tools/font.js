"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontFamily = exports.FontSize = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var dropdown_1 = require("../components/dropdown");
var react_1 = require("react");
var counter_1 = require("../components/counter");
var useRefValue_1 = require("../../hooks/useRefValue");
function FontSize(props) {
    var editor = props.editor;
    var _fontSize = editor.getAttributes("textStyle").fontSize;
    var fontSize = _fontSize || "16px";
    var fontSizeAsNumber = (0, useRefValue_1.useRefValue)(parseInt(fontSize.replace("px", "")));
    var decreaseFontSize = (0, react_1.useCallback)(function () {
        return Math.max(8, fontSizeAsNumber.current - 1);
    }, []);
    var increaseFontSize = (0, react_1.useCallback)(function () {
        return Math.min(120, fontSizeAsNumber.current + 1);
    }, []);
    return ((0, jsx_runtime_1.jsx)(counter_1.Counter, { title: "font size", onDecrease: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize("".concat(decreaseFontSize(), "px")).run();
        }, onIncrease: function () {
            var _a;
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize("".concat(increaseFontSize(), "px")).run();
        }, onReset: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize("16px").run(); }, value: fontSize }));
}
exports.FontSize = FontSize;
var fontFamilies = {
    System: "Open Sans",
    Serif: "serif",
    Monospace: "monospace",
};
function FontFamily(props) {
    var _a, _b;
    var editor = props.editor;
    var currentFontFamily = ((_b = (_a = Object.entries(fontFamilies)
        .find(function (_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        return editor.isActive("textStyle", { fontFamily: value });
    })) === null || _a === void 0 ? void 0 : _a.map(function (a) { return a; })) === null || _b === void 0 ? void 0 : _b.at(0)) || "System";
    var items = (0, react_1.useMemo)(function () { return toMenuItems(editor, currentFontFamily); }, [currentFontFamily]);
    return ((0, jsx_runtime_1.jsx)(dropdown_1.Dropdown, { selectedItem: currentFontFamily, items: items, menuWidth: 130 }));
}
exports.FontFamily = FontFamily;
function toMenuItems(editor, currentFontFamily) {
    var menuItems = [];
    var _loop_1 = function (key) {
        var value = fontFamilies[key];
        menuItems.push({
            key: key,
            type: "button",
            title: key,
            isChecked: key === currentFontFamily,
            onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontFamily(value).run(); },
        });
    };
    for (var key in fontFamilies) {
        _loop_1(key);
    }
    return menuItems;
}
