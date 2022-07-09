"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbedComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const toolbargroup_1 = require("../../toolbar/components/toolbargroup");
const toolbar_1 = require("../../toolbar");
const resizer_1 = require("../../components/resizer");
function EmbedComponent(props) {
    const { editor, updateAttributes, selected, node } = props;
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const embedRef = (0, react_1.useRef)();
    const { src, width, height, align } = node.attrs;
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ sx: {
                display: "flex",
                justifyContent: align === "center" ? "center" : align === "left" ? "start" : "end",
                position: "relative",
            } }, { children: (0, jsx_runtime_1.jsxs)(resizer_1.Resizer, Object.assign({ editor: editor, selected: selected, width: width, height: height, onResize: (width, height) => {
                    updateAttributes({
                        width,
                        height,
                    }, { addToHistory: true, preventUpdate: false });
                } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ width: "100%", sx: {
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
                        } }, { children: [(0, jsx_runtime_1.jsx)(toolbar_1.Icon, { path: toolbar_1.Icons.dragHandle, size: "big" }), (0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                                            position: "absolute",
                                            top: -10,
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
                                            } }) })) }))) })] })), (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ as: "iframe", ref: embedRef, src: src, width: "100%", height: "100%", sx: {
                            bg: "bgSecondary",
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        }, onLoad: () => setIsLoading(false) }, props)), isLoading && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                            position: "absolute",
                            bottom: 0,
                            width: "100%",
                            height: "calc(100% - 20px)",
                            alignItems: "center",
                            justifyContent: "center",
                        } }, { children: (0, jsx_runtime_1.jsx)(toolbar_1.Icon, { path: toolbar_1.Icons.loading, rotate: true, size: 32, color: "disabled" }) })))] })) })) }));
}
exports.EmbedComponent = EmbedComponent;
