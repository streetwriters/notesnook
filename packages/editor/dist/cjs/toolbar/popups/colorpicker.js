"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorPicker = exports.DEFAULT_COLORS = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const forms_1 = require("@rebass/forms");
const icon_1 = require("../components/icon");
const icons_1 = require("../icons");
const react_1 = require("react");
const tinycolor2_1 = __importDefault(require("tinycolor2"));
const react_colorful_1 = require("react-colorful");
const button_1 = require("../../components/button");
const debounce_1 = require("../../utils/debounce");
exports.DEFAULT_COLORS = [
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#f44336",
];
const PALETTE_SIZE = [35, 35, 25];
function ColorPicker(props) {
    const { colors = exports.DEFAULT_COLORS, color, onClear, onChange, title, onClose, expanded, } = props;
    const ref = (0, react_1.useRef)();
    const [isPickerOpen, setIsPickerOpen] = (0, react_1.useState)(expanded || false);
    const [currentColor, setCurrentColor] = (0, react_1.useState)((0, tinycolor2_1.default)(color || colors[0]).toHexString());
    const tColor = (0, tinycolor2_1.default)(currentColor);
    (0, react_1.useEffect)(() => {
        if (!ref.current)
            return;
        if (isPickerOpen)
            ref.current.focus({ preventScroll: true });
    }, [isPickerOpen]);
    const onColorChange = (0, react_1.useCallback)((0, debounce_1.debounce)((color) => {
        onChange(color);
    }, 500), [onChange]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ ref: ref, tabIndex: -1, sx: {
            bg: "background",
            flexDirection: "column",
            ".react-colorful": {
                width: "auto",
                height: 150,
            },
            ".react-colorful__saturation": {
                borderRadius: ["default", 0],
            },
            width: ["calc(100vw - 20px)", 250],
            //  width: ["auto", 250],
        } }, { children: [onClose && ((0, jsx_runtime_1.jsxs)(rebass_1.Box, Object.assign({ sx: {
                    display: ["none", "flex"],
                    justifyContent: "space-between",
                    p: 2,
                    pb: isPickerOpen ? 2 : 0,
                    //pb: 0,
                    alignItems: "center",
                }, onClick: onClose }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "title" }, { children: title })), (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "icon", sx: { p: 0 } }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) }))] }))), isPickerOpen ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_colorful_1.HexColorPicker, { onChange: (color) => {
                            setCurrentColor(color);
                            onColorChange(color);
                        }, onTouchEnd: () => onChange(currentColor), onMouseUp: () => onChange(currentColor) }), (0, jsx_runtime_1.jsx)(forms_1.Input, { variant: "clean", placeholder: "#000000", spellCheck: false, sx: {
                            my: 2,
                            p: 0,
                            borderRadius: 0,
                            fontSize: ["title", "title", "body"],
                            color: "fontTertiary",
                            textAlign: "center",
                            letterSpacing: 1.5,
                        }, value: currentColor.toUpperCase(), maxLength: 7, onChange: (e) => {
                            const { value } = e.target;
                            if (!value)
                                return;
                            if ((0, tinycolor2_1.default)(value, { format: "hex" }).isValid()) {
                                setCurrentColor(value);
                                onChange(value);
                            }
                        } })] })) : null, (0, jsx_runtime_1.jsxs)(rebass_1.Flex, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ className: "hide-scrollbar", sx: {
                            flex: 1,
                            p: 1,
                            overflowX: ["auto", "hidden"],
                            flexWrap: ["nowrap", "wrap"],
                        } }, { children: [(0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "icon", sx: {
                                    flexShrink: 0,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: onClear }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.colorClear, color: "text", size: 15 }) })), (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "secondary", sx: {
                                    flexShrink: 0,
                                    bg: currentColor,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    // boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: () => setIsPickerOpen((s) => !s) }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.palette, color: tColor.isDark() ? "static" : "icon", size: 18 }) })), colors.map((color) => ((0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", sx: {
                                    flex: "0 0 auto",
                                    bg: color,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    ml: [2, 1, 1],
                                    mb: [0, 1, 1],
                                    borderRadius: 50,
                                    //   boxShadow: "menu",
                                }, onClick: () => {
                                    setCurrentColor(color);
                                    onChange(color);
                                } }, color)))] })), onClose && ((0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "icon", sx: { display: ["block", "none"], px: 2 }, onClick: onClose }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.close, size: "big" }) })))] })] })));
}
exports.ColorPicker = ColorPicker;
