"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const re_resizable_1 = require("re-resizable");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const toolbargroup_1 = require("../../toolbar/components/toolbargroup");
function EmbedComponent(props) {
    const { editor, updateAttributes, selected, node } = props;
    const embedRef = (0, react_1.useRef)();
    const { src, width, height, align } = node.attrs;
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ sx: {
                display: "flex",
                justifyContent: align === "center" ? "center" : align === "left" ? "start" : "end",
            } }, { children: (0, jsx_runtime_1.jsxs)(re_resizable_1.Resizable, Object.assign({ enable: {
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
                }, lockAspectRatio: true }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ width: "100%", sx: {
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
                        } }, { children: (0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                                        position: "absolute",
                                        top: -40,
                                        mb: 2,
                                        alignItems: "end",
                                    } }, { children: (0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { editor: editor, tools: [
                                            "embedAlignLeft",
                                            "embedAlignCenter",
                                            "embedAlignRight",
                                            "embedProperties",
                                        ], sx: {
                                            boxShadow: "menu",
                                            borderRadius: "default",
                                            bg: "background",
                                        } }) })) }))) }) })), (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ as: "iframe", ref: embedRef, src: src, width: "100%", height: "100%", sx: {
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        } }, props))] })) })) }));
}
exports.EmbedComponent = EmbedComponent;
