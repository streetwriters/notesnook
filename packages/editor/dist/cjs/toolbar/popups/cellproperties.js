"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CellProperties = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const tabs_1 = require("../../components/tabs");
const icon_1 = require("../components/icon");
// import { MenuPresenter } from "../../components/menu/menu";
const popup_1 = require("../components/popup");
const icons_1 = require("../icons");
const colorpicker_1 = require("./colorpicker");
function CellProperties(props) {
    const { editor, onClose } = props;
    const attributes = editor.getAttributes("tableCell");
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, Object.assign({ title: "Cell properties", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(tabs_1.Tabs, Object.assign({ activeIndex: 0 }, { children: [(0, jsx_runtime_1.jsxs)(tabs_1.Tab, Object.assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell background color", path: icons_1.Icons.backgroundColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.backgroundColor, onChange: (color) => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", color);
                            }, onClear: () => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", undefined);
                            } })] })), (0, jsx_runtime_1.jsxs)(tabs_1.Tab, Object.assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell text color", path: icons_1.Icons.textColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.color, onChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", color); }, onClear: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", undefined); } })] })), (0, jsx_runtime_1.jsxs)(tabs_1.Tab, Object.assign({ title: (0, jsx_runtime_1.jsx)(icon_1.Icon, { title: "Cell border color", path: icons_1.Icons.cellBorderColor, size: 16 }) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Box, { mt: 2 }), (0, jsx_runtime_1.jsx)(colorpicker_1.ColorPicker, { expanded: true, color: attributes.borderColor, onChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", color); }, onClear: () => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", undefined);
                            } })] }))] })) })));
}
exports.CellProperties = CellProperties;
