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
import { useTheme } from "@notesnook/theme";
import { Flex } from "rebass";
import { findToolById } from "./tools";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
export function Toolbar(props) {
    var editor = props.editor, theme = props.theme, accent = props.accent, scale = props.scale;
    var themeProperties = useTheme({ accent: accent, theme: theme, scale: scale });
    var tools = [
        ["bold", "italic", "underline", "strikethrough", "code"],
        ["fontSize", "fontFamily", "headings"],
        ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
        ["subscript", "superscript", "horizontalRule"],
        ["codeblock", "blockquote"],
        ["formatClear", "ltr", "rtl"],
        ["numberedList", "bulletList", "checklist"],
        ["link", "image", "attachment", "table"],
        ["textColor", "highlight"],
    ];
    if (!editor)
        return null;
    return (_jsxs(ThemeProvider, __assign({ theme: themeProperties }, { children: [_jsx(Flex, __assign({ className: "editor-toolbar", sx: { flexWrap: "wrap" } }, { children: tools.map(function (tools) {
                    return (_jsx(Flex, __assign({ className: "toolbar-group", sx: {
                            pr: 2,
                            mr: 2,
                            borderRight: "1px solid var(--border)",
                            ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                        } }, { children: tools.map(function (toolId) {
                            var Component = findToolById(toolId).render;
                            return _jsx(Component, { editor: editor });
                        }) })));
                }) })), _jsx(EditorFloatingMenus, { editor: editor })] })));
}
