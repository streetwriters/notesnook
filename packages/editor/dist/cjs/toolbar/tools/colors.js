"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextColor = exports.Highlight = exports.ColorTool = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const tinycolor2_1 = __importDefault(require("tinycolor2"));
const popuppresenter_1 = require("../../components/popuppresenter");
const config_1 = require("../../utils/config");
const splitbutton_1 = require("../components/splitbutton");
const colorpicker_1 = require("../popups/colorpicker");
const toolbarstore_1 = require("../stores/toolbarstore");
const dom_1 = require("../utils/dom");
function ColorTool(props) {
    const { editor, onColorChange, getActiveColor, title, cacheKey } = props, toolProps = __rest(props, ["editor", "onColorChange", "getActiveColor", "title", "cacheKey"]);
    const activeColor = getActiveColor() || config_1.config.get(cacheKey);
    const tColor = (0, tinycolor2_1.default)(activeColor);
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsx)(splitbutton_1.SplitButton, Object.assign({}, toolProps, { iconColor: activeColor && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: activeColor || "transparent",
            ":hover": {
                bg: activeColor ? tColor.darken(5).toRgbString() : "transparent",
            },
        }, onOpen: () => setIsOpen((s) => !s), toggled: isOpen, onClick: () => onColorChange(activeColor) }, { children: (0, jsx_runtime_1.jsx)(popuppresenter_1.PopupWrapper, { isOpen: isOpen, id: props.icon, group: "color", position: {
                isTargetAbsolute: true,
                target: (0, dom_1.getToolbarElement)(),
                align: isBottom ? "center" : "end",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, focusOnRender: false, blocking: false, renderPopup: (close) => ((0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { color: activeColor, onClear: () => {
                    onColorChange();
                    config_1.config.set(cacheKey, null);
                }, onChange: (color) => {
                    onColorChange(color);
                    config_1.config.set(cacheKey, color);
                }, onClose: close, title: title })) }) })));
}
exports.ColorTool = ColorTool;
function Highlight(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(ColorTool, Object.assign({}, props, { cacheKey: "highlight", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("highlight").color; }, title: "Background color", onColorChange: (color) => {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleHighlight({ color }).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetHighlight().run();
        } })));
}
exports.Highlight = Highlight;
function TextColor(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(ColorTool, Object.assign({}, props, { cacheKey: "textColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("textStyle").color; }, title: "Text color", onColorChange: (color) => {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setColor(color).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetColor().run();
        } })));
}
exports.TextColor = TextColor;
