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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellProperties = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var tabs_1 = require("../../components/tabs");
var icon_1 = require("../components/icon");
// import { MenuPresenter } from "../../components/menu/menu";
var popup_1 = require("../components/popup");
var icons_1 = require("../icons");
var colorpicker_1 = require("./colorpicker");
function CellProperties(props) {
    var editor = props.editor, onClose = props.onClose;
    var attributes = editor.getAttributes("tableCell");
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, __assign({ title: "Cell properties", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, __assign({ activeIndex: 0 }, { children: [(0, jsx_runtime_1.jsxs)(tabs_1.Tab, __assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell background color", path: icons_1.Icons.backgroundColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.backgroundColor, onChange: function (color) {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", color);
                            }, onClear: function () {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", undefined);
                            } })] })), (0, jsx_runtime_1.jsxs)(tabs_1.Tab, __assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell text color", path: icons_1.Icons.textColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.color, onChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", color); }, onClear: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", undefined); } })] })), (0, jsx_runtime_1.jsxs)(tabs_1.Tab, __assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell border color", path: icons_1.Icons.cellBorderColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.borderColor, onChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", color); }, onClear: function () {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", undefined);
                            } })] }))] })) })));
}
exports.CellProperties = CellProperties;
