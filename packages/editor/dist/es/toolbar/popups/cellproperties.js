import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from "rebass";
import { Tab, Tabs } from "../../components/tabs";
import { Icon } from "../components/icon";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { Icons } from "../icons";
import { ColorPicker } from "./color-picker";
export function CellProperties(props) {
    const { editor, onClose } = props;
    const attributes = editor.getAttributes("tableCell");
    return (_jsx(Popup, Object.assign({ title: "Cell properties", onClose: onClose }, { children: _jsxs(Tabs, Object.assign({ activeIndex: 0 }, { children: [_jsxs(Tab, Object.assign({ title: _jsx(Icon, { title: "Cell background color", path: Icons.backgroundColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.backgroundColor, onChange: (color) => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", color);
                            }, onClear: () => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("backgroundColor", undefined);
                            } })] })), _jsxs(Tab, Object.assign({ title: _jsx(Icon, { title: "Cell text color", path: Icons.textColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.color, onChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", color); }, onClear: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("color", undefined); } })] })), _jsxs(Tab, Object.assign({ title: _jsx(Icon, { title: "Cell border color", path: Icons.cellBorderColor, size: 16 }) }, { children: [_jsx(Box, { mt: 2 }), _jsx(ColorPicker, { expanded: true, color: attributes.borderColor, onChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", color); }, onClear: () => {
                                var _a;
                                return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderColor", undefined);
                            } })] }))] })) })));
}
