import { jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
var FontSize = /** @class */ (function () {
    function FontSize() {
        var _this = this;
        this.title = "Font size";
        this.id = "fontSize";
        this.defaultFontSizes = [
            12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
        ];
        this.render = function (props) {
            var editor = props.editor;
            var currentFontSize = _this.defaultFontSizes.find(function (size) {
                return editor.isActive("textStyle", { fontSize: "".concat(size, "px") });
            }) || 16;
            return (_jsx(Dropdown, { selectedItem: "".concat(currentFontSize, "px"), items: _this.defaultFontSizes.map(function (size) { return ({
                    key: "".concat(size, "px"),
                    type: "menuitem",
                    title: "".concat(size, "px"),
                    isChecked: size === currentFontSize,
                    onClick: function () { return editor.chain().focus().setFontSize("".concat(size, "px")).run(); },
                }); }) }));
        };
    }
    return FontSize;
}());
export { FontSize };
var FontFamily = /** @class */ (function () {
    function FontFamily() {
        var _this = this;
        this.title = "Font family";
        this.id = "fontFamily";
        this.fontFamilies = {
            System: "Open Sans",
            Serif: "serif",
            Monospace: "monospace",
        };
        this.render = function (props) {
            var _a, _b;
            var editor = props.editor;
            var currentFontFamily = ((_b = (_a = Object.entries(_this.fontFamilies)
                .find(function (_a) {
                var key = _a[0], value = _a[1];
                return editor.isActive("textStyle", { fontFamily: value });
            })) === null || _a === void 0 ? void 0 : _a.map(function (a) { return a; })) === null || _b === void 0 ? void 0 : _b.at(0)) || "System";
            return (_jsx(Dropdown, { selectedItem: currentFontFamily, items: _this.toMenuItems(editor, currentFontFamily) }));
        };
    }
    FontFamily.prototype.toMenuItems = function (editor, currentFontFamily) {
        var menuItems = [];
        var _loop_1 = function (key) {
            var value = this_1.fontFamilies[key];
            menuItems.push({
                key: key,
                type: "menuitem",
                title: key,
                isChecked: key === currentFontFamily,
                onClick: function () { return editor.chain().focus().setFontFamily(value).run(); },
            });
        };
        var this_1 = this;
        for (var key in this.fontFamilies) {
            _loop_1(key);
        }
        return menuItems;
    };
    return FontFamily;
}());
export { FontFamily };
