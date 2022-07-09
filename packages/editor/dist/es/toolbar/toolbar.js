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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Flex } from "rebass";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { getDefaultPresets, STATIC_TOOLBAR_GROUPS } from "./tool-definitions";
import { useEffect, useMemo } from "react";
import { useIsMobile, useToolbarStore, } from "./stores/toolbar-store";
import { ToolbarGroup } from "./components/toolbar-group";
import { EditorContext, PopupRenderer, } from "../components/popup-presenter/popuprenderer";
export function Toolbar(props) {
    const { editor, theme, location, tools = getDefaultPresets().default, sx } = props, flexProps = __rest(props, ["editor", "theme", "location", "tools", "sx"]);
    const toolbarTools = useMemo(() => [...STATIC_TOOLBAR_GROUPS, ...tools], [tools]);
    const isMobile = useIsMobile();
    const setToolbarLocation = useToolbarStore((store) => store.setToolbarLocation);
    useEffect(() => {
        setToolbarLocation(location);
    }, [location]);
    if (!editor)
        return null;
    return (_jsx(ThemeProvider, Object.assign({ theme: theme }, { children: _jsx(EditorContext.Provider, Object.assign({ value: editor }, { children: _jsxs(PopupRenderer, Object.assign({ editor: editor }, { children: [_jsx(Flex, Object.assign({ className: "editor-toolbar", sx: Object.assign(Object.assign({}, sx), { flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "hidden" }) }, flexProps, { children: toolbarTools.map((tools) => {
                            return (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                                    flexShrink: 0,
                                    pr: 2,
                                    mr: 2,
                                    borderRight: "1px solid var(--border)",
                                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                                } }, tools.join("")));
                        }) })), _jsx(EditorFloatingMenus, { editor: editor })] })) })) })));
}
