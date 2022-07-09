import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex } from "rebass";
import { useRef, useState } from "react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { Icon, Icons } from "../../toolbar";
import { Resizer } from "../../components/resizer";
export function EmbedComponent(props) {
    const { editor, updateAttributes, selected, node } = props;
    const [isLoading, setIsLoading] = useState(true);
    const embedRef = useRef();
    const { src, width, height, align } = node.attrs;
    return (_jsx(_Fragment, { children: _jsx(Box, Object.assign({ sx: {
                display: "flex",
                justifyContent: align === "center" ? "center" : align === "left" ? "start" : "end",
                position: "relative",
            } }, { children: _jsxs(Resizer, Object.assign({ editor: editor, selected: selected, width: width, height: height, onResize: (width, height) => {
                    updateAttributes({
                        width,
                        height,
                    }, { addToHistory: true, preventUpdate: false });
                } }, { children: [_jsxs(Flex, Object.assign({ width: "100%", sx: {
                            position: "relative",
                            justifyContent: "end",
                            p: "small",
                            bg: editor.isEditable ? "bgSecondary" : "transparent",
                            borderTopLeftRadius: "default",
                            borderTopRightRadius: "default",
                            borderColor: selected ? "border" : "bgSecondary",
                            cursor: "pointer",
                            ":hover": {
                                borderColor: "border",
                            },
                        } }, { children: [_jsx(Icon, { path: Icons.dragHandle, size: "big" }), _jsx(DesktopOnly, { children: selected && (_jsx(Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: _jsx(Flex, Object.assign({ sx: {
                                            position: "absolute",
                                            top: -10,
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
                                            } }) })) }))) })] })), _jsx(Box, Object.assign({ as: "iframe", ref: embedRef, src: src, width: "100%", height: "100%", sx: {
                            bg: "bgSecondary",
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        }, onLoad: () => setIsLoading(false) }, props)), isLoading && (_jsx(Flex, Object.assign({ sx: {
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            height: "calc(100% - 20px)",
                            alignItems: "center",
                            justifyContent: "center",
                        } }, { children: _jsx(Icon, { path: Icons.loading, rotate: true, size: 32, color: "disabled" }) })))] })) })) }));
}
