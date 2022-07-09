"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const toolbargroup_1 = require("../../toolbar/components/toolbargroup");
const toolbarstore_1 = require("../../toolbar/stores/toolbarstore");
const resizer_1 = require("../../components/resizer");
function ImageComponent(props) {
    const { editor, updateAttributes, node, selected } = props;
    const isMobile = (0, toolbarstore_1.useIsMobile)();
    let { src, alt, title, width, height, align, float } = node.attrs;
    const imageRef = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!imageRef.current || !src)
                return;
            imageRef.current.src = yield dataUriToBlobURL(src);
        }))();
    }, [src, imageRef]);
    if (isMobile)
        float = false;
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(rebass_1.Box, Object.assign({ sx: {
                display: float ? "block" : "flex",
                justifyContent: float
                    ? "stretch"
                    : align === "center"
                        ? "center"
                        : align === "left"
                            ? "start"
                            : "end",
                ":hover .drag-handle, :active .drag-handle": {
                    opacity: 1,
                },
            } }, { children: (0, jsx_runtime_1.jsxs)(resizer_1.Resizer, Object.assign({ editor: editor, selected: selected, width: width, height: height, onResize: (width, height) => {
                    updateAttributes({
                        width,
                        height,
                    }, { addToHistory: true, preventUpdate: false });
                } }, { children: [(0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                                    position: "absolute",
                                    top: -40,
                                    mb: 2,
                                    alignItems: "end",
                                } }, { children: (0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { editor: editor, tools: [
                                        "imageAlignLeft",
                                        "imageAlignCenter",
                                        "imageAlignRight",
                                        "imageProperties",
                                    ], sx: {
                                        boxShadow: "menu",
                                        borderRadius: "default",
                                        bg: "background",
                                    } }) })) }))) }), selected && ((0, jsx_runtime_1.jsx)(icon_1.Icon, { className: "drag-handle", "data-drag-handle": true, draggable: true, path: icons_1.Icons.dragHandle, sx: {
                            cursor: "grab",
                            position: "absolute",
                            top: 2,
                            left: 2,
                            zIndex: 999,
                        } })), (0, jsx_runtime_1.jsx)(rebass_1.Image, Object.assign({ "data-drag-image": true, ref: imageRef, alt: alt, src: "/placeholder.svg", title: title, width: "100%", height: "100%", sx: {
                            bg: "bgSecondary",
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        } }, props))] })) })) }));
}
exports.ImageComponent = ImageComponent;
function dataUriToBlobURL(dataurl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dataurl.startsWith("data:image"))
            return dataurl;
        const response = yield fetch(dataurl);
        const blob = yield response.blob();
        return URL.createObjectURL(blob);
    });
}
