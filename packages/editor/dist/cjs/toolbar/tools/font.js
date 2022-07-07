"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontFamily = exports.FontSize = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const dropdown_1 = require("../components/dropdown");
const react_1 = require("react");
const counter_1 = require("../components/counter");
const useRefValue_1 = require("../../hooks/useRefValue");
function FontSize(props) {
    const { editor } = props;
    const { fontSize: _fontSize } = editor.getAttributes("textStyle");
    const fontSize = _fontSize || "16px";
    const fontSizeAsNumber = (0, useRefValue_1.useRefValue)(parseInt(fontSize.replace("px", "")));
    const decreaseFontSize = (0, react_1.useCallback)(() => {
        return Math.max(8, fontSizeAsNumber.current - 1);
    }, []);
    const increaseFontSize = (0, react_1.useCallback)(() => {
        return Math.min(120, fontSizeAsNumber.current + 1);
    }, []);
    return ((0, jsx_runtime_1.jsx)(counter_1.Counter, { title: "font size", onDecrease: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`${decreaseFontSize()}px`).run();
        }, onIncrease: () => {
            var _a;
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`${increaseFontSize()}px`).run();
        }, onReset: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`16px`).run(); }, value: fontSize }));
}
exports.FontSize = FontSize;
const fontFamilies = {
    "Sans-serif": "Open Sans",
    Serif: "serif",
    Monospace: "monospace",
};
function FontFamily(props) {
    var _a, _b;
    const { editor } = props;
    const currentFontFamily = ((_b = (_a = Object.entries(fontFamilies)
        .find(([key, value]) => editor.isActive("textStyle", { fontFamily: value }))) === null || _a === void 0 ? void 0 : _a.map((a) => a)) === null || _b === void 0 ? void 0 : _b.at(0)) || "Sans-serif";
    const items = (0, react_1.useMemo)(() => toMenuItems(editor, currentFontFamily), [currentFontFamily]);
    return ((0, jsx_runtime_1.jsx)(dropdown_1.Dropdown, { selectedItem: currentFontFamily, items: items, menuWidth: 130 }));
}
exports.FontFamily = FontFamily;
function toMenuItems(editor, currentFontFamily) {
    const menuItems = [];
    for (const key in fontFamilies) {
        const value = fontFamilies[key];
        menuItems.push({
            key,
            type: "button",
            title: key,
            isChecked: key === currentFontFamily,
            onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontFamily(value).run(); },
            styles: {
                fontFamily: value,
            },
        });
    }
    return menuItems;
}
