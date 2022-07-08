import { jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
import { useCallback, useMemo } from "react";
import { Counter } from "../components/counter";
import { useRefValue } from "../../hooks/use-ref-value";
export function FontSize(props) {
    const { editor } = props;
    const { fontSize: _fontSize } = editor.getAttributes("textStyle");
    const fontSize = _fontSize || "16px";
    const fontSizeAsNumber = useRefValue(parseInt(fontSize.replace("px", "")));
    const decreaseFontSize = useCallback(() => {
        return Math.max(8, fontSizeAsNumber.current - 1);
    }, []);
    const increaseFontSize = useCallback(() => {
        return Math.min(120, fontSizeAsNumber.current + 1);
    }, []);
    return (_jsx(Counter, { title: "font size", onDecrease: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`${decreaseFontSize()}px`).run();
        }, onIncrease: () => {
            var _a;
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`${increaseFontSize()}px`).run();
        }, onReset: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setFontSize(`16px`).run(); }, value: fontSize }));
}
const fontFamilies = {
    "Sans-serif": "Open Sans",
    Serif: "serif",
    Monospace: "monospace",
};
export function FontFamily(props) {
    var _a, _b;
    const { editor } = props;
    const currentFontFamily = ((_b = (_a = Object.entries(fontFamilies)
        .find(([key, value]) => editor.isActive("textStyle", { fontFamily: value }))) === null || _a === void 0 ? void 0 : _a.map((a) => a)) === null || _b === void 0 ? void 0 : _b.at(0)) || "Sans-serif";
    const items = useMemo(() => toMenuItems(editor, currentFontFamily), [currentFontFamily]);
    return (_jsx(Dropdown, { id: "fontFamily", group: "font", selectedItem: currentFontFamily, items: items, menuWidth: 130 }));
}
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
