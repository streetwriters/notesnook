import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex } from "rebass";
import { Resizable } from "re-resizable";
import { useRef } from "react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
export function EmbedComponent(props) {
    const { editor, updateAttributes, selected, node } = props;
    const embedRef = useRef();
    const { src, width, height, align } = node.attrs;
    return (_jsx(_Fragment, { children: _jsx(Box, Object.assign({ sx: {
                display: "flex",
                justifyContent: align === "center" ? "center" : align === "left" ? "start" : "end",
            } }, { children: _jsxs(Resizable, Object.assign({ enable: {
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
                }, maxWidth: "100%", onResizeStop: (e, direction, ref, d) => {
                    updateAttributes({
                        width: ref.clientWidth,
                        height: ref.clientHeight,
                    });
                }, lockAspectRatio: true }, { children: [_jsx(Flex, Object.assign({ width: "100%", sx: {
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
                        } }, { children: _jsx(DesktopOnly, { children: selected && (_jsx(Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: _jsx(Flex, Object.assign({ sx: {
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
                                        } }) })) }))) }) })), _jsx(Box, Object.assign({ as: "iframe", ref: embedRef, src: src, width: "100%", height: "100%", sx: {
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        } }, props))] })) })) }));
}
