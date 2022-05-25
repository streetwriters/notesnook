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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTheme } from "@notesnook/theme";
import { Flex } from "rebass";
import { findToolById } from "./tools";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { getToolDefinition } from "./tool-definitions";
import { ToolButton } from "./components/tool-button";
import { useEffect, useRef, useState } from "react";
import { MenuPresenter } from "../components/menu";
import { Popup } from "./components/popup";
import { ToolbarContext, useToolbarContext } from "./hooks/useToolbarContext";
import { useToolbarLocation, useToolbarStore, } from "./stores/toolbar-store";
export function Toolbar(props) {
    var editor = props.editor, theme = props.theme, accent = props.accent, scale = props.scale, location = props.location, isMobile = props.isMobile;
    var themeProperties = useTheme({ accent: accent, theme: theme, scale: scale });
    var _a = __read(useState(), 2), currentPopup = _a[0], setCurrentPopup = _a[1];
    var _b = useToolbarStore(), setIsMobile = _b.setIsMobile, setToolbarLocation = _b.setToolbarLocation;
    useEffect(function () {
        setIsMobile(isMobile || false);
        setToolbarLocation(location);
    }, [isMobile, location]);
    var tools = [
        ["insertBlock"],
        [
            "bold",
            "italic",
            "underline",
            [
                "strikethrough",
                "code",
                "subscript",
                "superscript",
                "highlight",
                "textColor",
            ],
        ],
        ["fontSize"],
        ["headings", "fontFamily"],
        ["numberedList", "bulletList"],
        ["link"],
        ["alignCenter", ["alignLeft", "alignRight", "alignJustify", "ltr", "rtl"]],
        ["clearformatting"],
    ];
    if (!editor)
        return null;
    return (_jsxs(ThemeProvider, __assign({ theme: themeProperties }, { children: [_jsx(ToolbarContext.Provider, __assign({ value: {
                    setCurrentPopup: setCurrentPopup,
                    currentPopup: currentPopup,
                } }, { children: _jsx(Flex, __assign({ className: "editor-toolbar", sx: { flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] } }, { children: tools.map(function (tools) {
                        return (_jsx(ToolbarGroup, { tools: tools, editor: editor, sx: {
                                flexShrink: 0,
                                pr: 2,
                                mr: 2,
                                borderRight: "1px solid var(--border)",
                                ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                            } }));
                    }) })) })), _jsx(EditorFloatingMenus, { editor: editor })] })));
}
function ToolbarGroup(props) {
    var tools = props.tools, editor = props.editor, flexProps = __rest(props, ["tools", "editor"]);
    return (_jsx(Flex, __assign({ className: "toolbar-group" }, flexProps, { children: tools.map(function (toolId) {
            if (Array.isArray(toolId)) {
                return (_jsx(MoreTools, { popupId: toolId.join(""), tools: toolId, editor: editor }));
            }
            else {
                var Component = findToolById(toolId);
                var toolDefinition = getToolDefinition(toolId);
                return _jsx(Component, __assign({ editor: editor }, toolDefinition));
            }
        }) })));
}
function MoreTools(props) {
    var popupId = props.popupId;
    var _a = useToolbarContext(), currentPopup = _a.currentPopup, setCurrentPopup = _a.setCurrentPopup;
    var toolbarLocation = useToolbarLocation();
    var buttonRef = useRef();
    var show = popupId === currentPopup;
    var setShow = function (state) {
        return setCurrentPopup === null || setCurrentPopup === void 0 ? void 0 : setCurrentPopup(state ? popupId : undefined);
    };
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, { icon: "more", title: "More", toggled: show, buttonRef: buttonRef, onMouseDown: function (e) { return e.preventDefault(); }, onClick: function () { return setShow(!show); } }), _jsx(MenuPresenter, __assign({ isOpen: show, onClose: function () { return setShow(false); }, items: [], options: {
                    type: "autocomplete",
                    position: {
                        isTargetAbsolute: true,
                        target: buttonRef.current || "mouse",
                        align: "center",
                        location: toolbarLocation === "bottom" ? "top" : "below",
                        yOffset: 5,
                    },
                } }, { children: _jsx(Popup, { children: _jsx(ToolbarGroup, { tools: props.tools, editor: props.editor, sx: {
                            p: 1,
                        } }) }) }))] }));
}
