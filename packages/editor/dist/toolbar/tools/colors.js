"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextColor = exports.Highlight = exports.ColorTool = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var tinycolor2_1 = __importDefault(require("tinycolor2"));
var popuppresenter_1 = require("../../components/popuppresenter");
var config_1 = require("../../utils/config");
var splitbutton_1 = require("../components/splitbutton");
var colorpicker_1 = require("../popups/colorpicker");
var toolbarstore_1 = require("../stores/toolbarstore");
var dom_1 = require("../utils/dom");
// TODO test rerendering
function _ColorTool(props) {
    var editor = props.editor, onColorChange = props.onColorChange, getActiveColor = props.getActiveColor, title = props.title, cacheKey = props.cacheKey, toolProps = __rest(props, ["editor", "onColorChange", "getActiveColor", "title", "cacheKey"]);
    var activeColor = getActiveColor() || config_1.config.get(cacheKey);
    var tColor = (0, tinycolor2_1.default)(activeColor);
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    var _a = __read((0, react_1.useState)(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    return ((0, jsx_runtime_1.jsx)(splitbutton_1.SplitButton, __assign({}, toolProps, { iconColor: activeColor && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: activeColor || "transparent",
            ":hover": {
                bg: activeColor ? tColor.darken(5).toRgbString() : "transparent",
            },
        }, onOpen: function () { return setIsOpen(function (s) { return !s; }); }, toggled: isOpen, onClick: function () { return onColorChange(activeColor); } }, { children: (0, jsx_runtime_1.jsx)(popuppresenter_1.PopupWrapper, { isOpen: isOpen, id: props.icon, group: "color", position: {
                isTargetAbsolute: true,
                target: (0, dom_1.getToolbarElement)(),
                align: isBottom ? "center" : "end",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, focusOnRender: false, blocking: false, renderPopup: function (close) { return ((0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { color: activeColor, onClear: function () {
                    onColorChange();
                    config_1.config.set(cacheKey, null);
                }, onChange: function (color) {
                    onColorChange(color);
                    config_1.config.set(cacheKey, color);
                }, onClose: close, title: title })); } }) })));
}
exports.ColorTool = react_1.default.memo(_ColorTool, function () { return true; });
function Highlight(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(exports.ColorTool, __assign({}, props, { cacheKey: "highlight", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("highlight").color; }, title: "Background color", onColorChange: function (color) {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleHighlight({ color: color }).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetHighlight().run();
        } })));
}
exports.Highlight = Highlight;
function TextColor(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(exports.ColorTool, __assign({}, props, { cacheKey: "textColor", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("textStyle").color; }, title: "Text color", onColorChange: function (color) {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setColor(color).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetColor().run();
        } })));
}
exports.TextColor = TextColor;
