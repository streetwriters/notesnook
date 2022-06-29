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
import { Box, Flex } from "rebass";
import { Resizable } from "re-resizable";
import { useRef } from "react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
export function EmbedComponent(props) {
    var editor = props.editor, updateAttributes = props.updateAttributes, selected = props.selected, node = props.node;
    var embedRef = useRef();
    var _a = node.attrs, src = _a.src, width = _a.width, height = _a.height, align = _a.align;
    return (_jsx(_Fragment, { children: _jsx(Box, __assign({ sx: {
                display: "flex",
                justifyContent: align === "center" ? "center" : align === "left" ? "start" : "end",
            } }, { children: _jsxs(Resizable, __assign({ enable: {
                    bottom: editor.isEditable,
                    left: editor.isEditable,
                    right: editor.isEditable,
                    top: editor.isEditable,
                    bottomLeft: editor.isEditable,
                    bottomRight: editor.isEditable,
                    topLeft: editor.isEditable,
                    topRight: editor.isEditable,
                }, size: {
                    height: height || "auto",
                    width: width || "auto",
                }, maxWidth: "100%", onResizeStop: function (e, direction, ref, d) {
                    updateAttributes({
                        width: ref.clientWidth,
                        height: ref.clientHeight,
                    });
                }, lockAspectRatio: true }, { children: [_jsx(Flex, __assign({ width: "100%", sx: {
                            position: "relative",
                            justifyContent: "end",
                            borderTop: editor.isEditable
                                ? "20px solid var(--bgSecondary)"
                                : "none",
                            borderTopLeftRadius: "default",
                            borderTopRightRadius: "default",
                            borderColor: selected ? "border" : "bgSecondary",
                            cursor: "pointer",
                            ":hover": {
                                borderColor: "border",
                            },
                        } }, { children: _jsx(DesktopOnly, { children: selected && (_jsx(Flex, __assign({ sx: { position: "relative", justifyContent: "end" } }, { children: _jsx(Flex, __assign({ sx: {
                                        position: "absolute",
                                        top: -40,
                                        mb: 2,
                                        alignItems: "end",
                                    } }, { children: _jsx(ToolbarGroup, { editor: editor, tools: [
                                            "embedAlignLeft",
                                            "embedAlignCenter",
                                            "embedAlignRight",
                                            "embedProperties",
                                        ], sx: {
                                            boxShadow: "menu",
                                            borderRadius: "default",
                                            bg: "background",
                                        } }) })) }))) }) })), _jsx(Box, __assign({ as: "iframe", ref: embedRef, src: src, width: "100%", height: "100%", sx: {
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        } }, props))] })) })) }));
}
