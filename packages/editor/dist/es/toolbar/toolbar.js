import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Flex } from "rebass";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { getDefaultPresets } from "./tool-definitions";
import { useEffect } from "react";
import { useToolbarStore, } from "./stores/toolbar-store";
import { ToolbarGroup } from "./components/toolbar-group";
import { EditorContext, PopupRenderer, } from "../components/popup-presenter/popuprenderer";
export function Toolbar(props) {
    const { editor, theme, location, tools = getDefaultPresets().default, } = props;
    const setToolbarLocation = useToolbarStore((store) => store.setToolbarLocation);
    useEffect(() => {
        setToolbarLocation(location);
    }, [location]);
    if (!editor)
        return null;
    return (_jsx(ThemeProvider, Object.assign({ theme: theme }, { children: _jsx(EditorContext.Provider, Object.assign({ value: editor }, { children: _jsxs(PopupRenderer, Object.assign({ editor: editor }, { children: [_jsx(Flex, Object.assign({ className: "editor-toolbar", sx: { flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] } }, { children: tools.map((tools) => {
                            return (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                                    flexShrink: 0,
                                    pr: 2,
                                    mr: 2,
                                    borderRight: "1px solid var(--border)",
                                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                                } }, tools.join("")));
                        }) })), _jsx(EditorFloatingMenus, { editor: editor })] })) })) })));
}
