import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { useCallback, useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Button } from "../../components/button";
import { debounce } from "../../utils/debounce";
export const DEFAULT_COLORS = [
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
export function ColorPicker(props) {
    const { colors = DEFAULT_COLORS, color, onClear, onChange, title, onClose, expanded, } = props;
    const ref = useRef();
    const [isPickerOpen, setIsPickerOpen] = useState(expanded || false);
    const [currentColor, setCurrentColor] = useState(tinycolor(color || colors[0]).toHexString());
    const tColor = tinycolor(currentColor);
    useEffect(() => {
        if (!ref.current)
            return;
        if (isPickerOpen)
            ref.current.focus({ preventScroll: true });
    }, [isPickerOpen]);
    const onColorChange = useCallback(debounce((color) => {
        onChange(color);
    }, 500), [onChange]);
    return (_jsxs(Flex, Object.assign({ ref: ref, tabIndex: -1, sx: {
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
        } }, { children: [onClose && (_jsxs(Box, Object.assign({ sx: {
                    display: ["none", "flex"],
                    justifyContent: "space-between",
                    p: 2,
                    pb: isPickerOpen ? 2 : 0,
                    //pb: 0,
                    alignItems: "center",
                }, onClick: onClose }, { children: [_jsx(Text, Object.assign({ variant: "title" }, { children: title })), _jsx(Button, Object.assign({ variant: "icon", sx: { p: 0 } }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) }))] }))), isPickerOpen ? (_jsxs(_Fragment, { children: [_jsx(HexColorPicker, { onChange: (color) => {
                            setCurrentColor(color);
                            onColorChange(color);
                        }, onTouchEnd: () => onChange(currentColor), onMouseUp: () => onChange(currentColor) }), _jsx(Input, { variant: "clean", placeholder: "#000000", spellCheck: false, sx: {
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
                            if (tinycolor(value, { format: "hex" }).isValid()) {
                                setCurrentColor(value);
                                onChange(value);
                            }
                        } })] })) : null, _jsxs(Flex, { children: [_jsxs(Flex, Object.assign({ className: "hide-scrollbar", sx: {
                            flex: 1,
                            p: 1,
                            overflowX: ["auto", "hidden"],
                            flexWrap: ["nowrap", "wrap"],
                        } }, { children: [_jsx(Button, Object.assign({ variant: "icon", sx: {
                                    flexShrink: 0,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                }, onClick: onClear }, { children: _jsx(Icon, { path: Icons.colorClear, color: "text", size: 15 }) })), _jsx(Button, Object.assign({ variant: "secondary", sx: {
                                    flexShrink: 0,
                                    bg: currentColor,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    borderRadius: 50,
                                    // boxShadow: "menu",
                                    p: 0,
                                    ml: [2, 2, 1],
                                    ":hover": {
                                        bg: currentColor,
                                    },
                                }, onClick: () => setIsPickerOpen((s) => !s) }, { children: _jsx(Icon, { path: Icons.palette, color: tColor.isDark() ? "static" : "icon", size: 18 }) })), colors.map((color) => (_jsx(Button, { sx: {
                                    flex: "0 0 auto",
                                    bg: color,
                                    width: PALETTE_SIZE,
                                    height: PALETTE_SIZE,
                                    ml: [2, 1, 1],
                                    mb: [0, 1, 1],
                                    borderRadius: 50,
                                    ":hover": {
                                        bg: color,
                                    },
                                }, onClick: () => {
                                    setCurrentColor(color);
                                    onChange(color);
                                } }, color)))] })), onClose && (_jsx(Button, Object.assign({ variant: "icon", sx: { display: ["block", "none"], px: 2 }, onClick: onClose }, { children: _jsx(Icon, { path: Icons.close, size: "big" }) })))] })] })));
}
