"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const emotion_theming_1 = require("emotion-theming");
const floatingmenus_1 = require("./floatingmenus");
const tooldefinitions_1 = require("./tooldefinitions");
const react_1 = require("react");
const toolbarstore_1 = require("./stores/toolbarstore");
const toolbargroup_1 = require("./components/toolbargroup");
const popuprenderer_1 = require("../components/popup-presenter/popuprenderer");
function Toolbar(props) {
    const { editor, theme, location, tools = (0, tooldefinitions_1.getDefaultPresets)().default, } = props;
    const setToolbarLocation = (0, toolbarstore_1.useToolbarStore)((store) => store.setToolbarLocation);
    (0, react_1.useEffect)(() => {
        setToolbarLocation(location);
    }, [location]);
    if (!editor)
        return null;
    return ((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, Object.assign({ theme: theme }, { children: (0, jsx_runtime_1.jsx)(popuprenderer_1.EditorContext.Provider, Object.assign({ value: editor }, { children: (0, jsx_runtime_1.jsxs)(popuprenderer_1.PopupRenderer, Object.assign({ editor: editor }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ className: "editor-toolbar", sx: { flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] } }, { children: tools.map((tools) => {
                            return ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { tools: tools, editor: editor, sx: {
                                    flexShrink: 0,
                                    pr: 2,
                                    mr: 2,
                                    borderRight: "1px solid var(--border)",
                                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                                } }, tools.join("")));
                        }) })), (0, jsx_runtime_1.jsx)(floatingmenus_1.EditorFloatingMenus, { editor: editor })] })) })) })));
}
exports.Toolbar = Toolbar;
