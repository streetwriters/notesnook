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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from "rebass";
import { Tab, Tabs } from "../../components/tabs";
import { Icon } from "../components/icon";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { Icons } from "../icons";
import { ColorPicker } from "./color-picker";
export function CellProperties(props) {
    var editor = props.editor, onClose = props.onClose;
    var attributes = editor.getAttributes("tableCell");
    return (_jsx(Popup, __assign({ title: "Cell properties", onClose: onClose }, { children: _jsxs(Tabs, __assign({ activeIndex: 0 }, { children: [_jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell background color", path: Icons.backgroundColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.backgroundColor, onChange: function (color) {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", color);
                            }, onClear: function () {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", undefined);
                            } })] })), _jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell text color", path: Icons.textColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.color, onChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", color); }, onClear: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", undefined); } })] })), _jsxs(Tab, __assign({ title: _jsx(Icon, { title: "Cell border color", path: Icons.cellBorderColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.borderColor, onChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", color); }, onClear: function () {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", undefined);
                            } })] }))] })) })));
}
