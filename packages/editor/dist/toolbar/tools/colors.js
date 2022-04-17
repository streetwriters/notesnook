var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Button, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import tinycolor from "tinycolor2";
export var DEFAULT_COLORS = [
    "#f44336",
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
];
var ColorTool = /** @class */ (function () {
    function ColorTool(id, title, icon, onColorChange) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.onColorChange = onColorChange;
        this.render = function (props) {
            var editor = props.editor;
            var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
            var attrs = editor.getAttributes(_this.id === "highlight" ? "highlight" : "textStyle");
            var ref = useRef(null);
            var isActive = editor.isActive(_this.id === "highlight" ? "highlight" : "textStyle", { color: /\W+/gm });
            return (_jsxs(Flex, __assign({ ref: ref }, { children: [_jsx(ToolButton, { title: _this.title, id: _this.id, icon: _this.icon, onClick: function () { }, toggled: false, sx: { mr: 0, bg: isActive ? attrs.color : "transparent" } }), _jsx(Button, __assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: function () { return setIsOpen(function (s) { return !s; }); } }, { children: _jsx(Icon, { path: Icons.chevronDown, color: "text", size: 18 }) })), _jsx(MenuPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [], 
                        // sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 }}
                        options: {
                            type: "menu",
                            position: {
                                target: ref.current || undefined,
                                isTargetAbsolute: true,
                                location: "below",
                                align: "center",
                                yOffset: 5,
                            },
                        } }, { children: _jsx(Flex, __assign({ sx: {
                                flexDirection: "column",
                                bg: "background",
                                boxShadow: "menu",
                                border: "1px solid var(--border)",
                                borderRadius: "default",
                                p: 1,
                                width: 160,
                            } }, { children: _jsx(ColorPicker, { colors: DEFAULT_COLORS, color: attrs.color, onClear: function () { return _this.onColorChange(editor); }, onChange: function (color) { return _this.onColorChange(editor, color); } }) })) }))] })));
        };
    }
    return ColorTool;
}());
var Highlight = /** @class */ (function (_super) {
    __extends(Highlight, _super);
    function Highlight() {
        return _super.call(this, "highlight", "Highlight", "highlight", function (editor, color) {
            return color
                ? editor.chain().focus().toggleHighlight({ color: color }).run()
                : editor.chain().focus().unsetHighlight().run();
        }) || this;
    }
    return Highlight;
}(ColorTool));
export { Highlight };
var TextColor = /** @class */ (function (_super) {
    __extends(TextColor, _super);
    function TextColor() {
        return _super.call(this, "textColor", "Text color", "textColor", function (editor, color) {
            return color
                ? editor.chain().focus().setColor(color).run()
                : editor.chain().focus().unsetColor().run();
        }) || this;
    }
    return TextColor;
}(ColorTool));
export { TextColor };
export function ColorPicker(props) {
    var colors = props.colors, color = props.color, onClear = props.onClear, onChange = props.onChange;
    var _a = useState(tinycolor(color || colors[0]).toHexString()), currentColor = _a[0], setCurrentColor = _a[1];
    return (_jsxs(_Fragment, { children: [_jsx(Flex, __assign({ sx: {
                    width: "100%",
                    height: 50,
                    bg: currentColor,
                    mb: 1,
                    borderRadius: "default",
                    alignItems: "center",
                    justifyContent: "center",
                } }, { children: _jsx(Text, __assign({ sx: {
                        fontSize: "subheading",
                        color: tinycolor(currentColor).isDark() ? "white" : "black",
                    } }, { children: currentColor })) })), _jsxs(Box, __assign({ sx: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                } }, { children: [colors.map(function (color) { return (_jsx(Box, { sx: {
                            bg: color,
                            width: 25,
                            height: 25,
                            m: "2px",
                            borderRadius: "default",
                            cursor: "pointer",
                            ":hover": {
                                filter: "brightness(85%)",
                            },
                        }, onClick: function () {
                            setCurrentColor(color);
                            onChange(color);
                        } })); }), _jsx(Flex, __assign({ sx: {
                            width: 25,
                            height: 25,
                            m: "2px",
                            borderRadius: "default",
                            cursor: "pointer",
                            alignItems: "center",
                            justifyContent: "center",
                            ":hover": {
                                filter: "brightness(85%)",
                            },
                        }, onClick: onClear }, { children: _jsx(Icon, { path: Icons.colorClear, size: 18 }) }))] })), _jsxs(Flex, __assign({ sx: {
                    mt: 1,
                    borderRadius: "default",
                } }, { children: [_jsx(Input, { placeholder: "#000000", sx: {
                            p: 1,
                            m: 0,
                            fontSize: "body",
                            border: "none",
                            borderWidth: 0,
                        }, value: currentColor, maxLength: 7, onChange: function (e) {
                            var value = e.target.value;
                            if (!value)
                                return;
                            setCurrentColor(value);
                        } }), _jsx(Button, __assign({ sx: {
                            bg: "transparent",
                            p: 1,
                            ":hover": { bg: "hover" },
                            cursor: "pointer",
                        }, onClick: function () { return onChange(currentColor); } }, { children: _jsx(Icon, { path: Icons.check, color: "text", size: 18 }) }))] }))] }));
}
