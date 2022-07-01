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
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { config } from "../../utils/config";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
// TODO test rerendering
function _ColorTool(props) {
    const { editor, onColorChange, getActiveColor, title, cacheKey } = props, toolProps = __rest(props, ["editor", "onColorChange", "getActiveColor", "title", "cacheKey"]);
    const activeColor = getActiveColor() || config.get(cacheKey);
    const tColor = tinycolor(activeColor);
    const isBottom = useToolbarLocation() === "bottom";
    const [isOpen, setIsOpen] = useState(false);
    return (_jsx(SplitButton, Object.assign({}, toolProps, { iconColor: activeColor && tColor.isDark() ? "static" : "icon", sx: {
            mr: 0,
            bg: activeColor || "transparent",
            ":hover": {
                bg: activeColor ? tColor.darken(5).toRgbString() : "transparent",
            },
        }, onOpen: () => setIsOpen((s) => !s), toggled: isOpen, onClick: () => onColorChange(activeColor) }, { children: _jsx(PopupWrapper, { isOpen: isOpen, id: props.icon, group: "color", position: {
                isTargetAbsolute: true,
                target: getToolbarElement(),
                align: isBottom ? "center" : "end",
                location: isBottom ? "top" : "below",
                yOffset: 10,
            }, focusOnRender: false, blocking: false, renderPopup: (close) => (_jsx(ColorPicker, { color: activeColor, onClear: () => {
                    onColorChange();
                    config.set(cacheKey, null);
                }, onChange: (color) => {
                    onColorChange(color);
                    config.set(cacheKey, color);
                }, onClose: close, title: title })) }) })));
}
export const ColorTool = React.memo(_ColorTool, () => true);
export function Highlight(props) {
    const { editor } = props;
    return (_jsx(ColorTool, Object.assign({}, props, { cacheKey: "highlight", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("highlight").color; }, title: "Background color", onColorChange: (color) => {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleHighlight({ color }).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetHighlight().run();
        } })));
}
export function TextColor(props) {
    const { editor } = props;
    return (_jsx(ColorTool, Object.assign({}, props, { cacheKey: "textColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("textStyle").color; }, title: "Text color", onColorChange: (color) => {
            var _a, _b;
            return color
                ? (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setColor(color).run()
                : (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetColor().run();
        } })));
}
