"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var emotion_theming_1 = require("emotion-theming");
var floatingmenus_1 = require("./floatingmenus");
var tooldefinitions_1 = require("./tooldefinitions");
var react_1 = require("react");
var toolbarstore_1 = require("./stores/toolbarstore");
var toolbargroup_1 = require("./components/toolbargroup");
var popuprenderer_1 = require("../components/popup-presenter/popuprenderer");
function Toolbar(props) {
    var editor = props.editor, theme = props.theme, location = props.location, isMobile = props.isMobile, _a = props.tools, tools = _a === void 0 ? tooldefinitions_1.DEFAULT_TOOLS : _a;
    var setIsMobile = (0, toolbarstore_1.useToolbarStore)(function (store) { return store.setIsMobile; });
    var setToolbarLocation = (0, toolbarstore_1.useToolbarStore)(function (store) { return store.setToolbarLocation; });
    (0, react_1.useEffect)(function () {
        setIsMobile(isMobile || false);
        setToolbarLocation(location);
    }, [isMobile, location]);
    if (!editor)
        return null;
    return ((0, jsx_runtime_1.jsx)(emotion_theming_1.ThemeProvider, __assign({ theme: theme }, { children: (0, jsx_runtime_1.jsx)(popuprenderer_1.EditorContext.Provider, __assign({ value: editor }, { children: (0, jsx_runtime_1.jsxs)(popuprenderer_1.PopupRenderer, __assign({ editor: editor }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ className: "editor-toolbar", sx: { flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] } }, { children: tools.map(function (tools) {
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
