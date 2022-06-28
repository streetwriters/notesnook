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
import { Flex } from "rebass";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { DEFAULT_TOOLS } from "./tool-definitions";
import { useEffect } from "react";
import { useToolbarStore, } from "./stores/toolbar-store";
import { ToolbarGroup } from "./components/toolbar-group";
import { EditorContext, PopupRenderer, } from "../components/popup-presenter/popuprenderer";
export function Toolbar(props) {
    var editor = props.editor, theme = props.theme, location = props.location, isMobile = props.isMobile, _a = props.tools, tools = _a === void 0 ? DEFAULT_TOOLS : _a;
    var setIsMobile = useToolbarStore(function (store) { return store.setIsMobile; });
    var setToolbarLocation = useToolbarStore(function (store) { return store.setToolbarLocation; });
    useEffect(function () {
        setIsMobile(isMobile || false);
        setToolbarLocation(location);
    }, [isMobile, location]);
    if (!editor)
        return null;
    return (_jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(EditorContext.Provider, __assign({ value: editor }, { children: _jsxs(PopupRenderer, __assign({ editor: editor }, { children: [_jsx(Flex, __assign({ className: "editor-toolbar", sx: { flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] } }, { children: tools.map(function (tools) {
                            return (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                                    flexShrink: 0,
                                    pr: 2,
                                    mr: 2,
                                    borderRight: "1px solid var(--border)",
                                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                                } }, tools.join("")));
                        }) })), _jsx(EditorFloatingMenus, { editor: editor })] })) })) })));
}
