var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Flex, Image } from "rebass";
import { useEffect, useRef } from "react";
import { DesktopOnly } from "../../components/responsive";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import { Resizer } from "../../components/resizer";
export function ImageComponent(props) {
    const { editor, updateAttributes, node, selected } = props;
    const isMobile = useIsMobile();
    let { src, alt, title, width, height, align, float } = node.attrs;
    const imageRef = useRef();
    useEffect(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!imageRef.current || !src)
                return;
            imageRef.current.src = yield dataUriToBlobURL(src);
        }))();
    }, [src, imageRef]);
    if (isMobile)
        float = false;
    return (_jsx(_Fragment, { children: _jsx(Box, Object.assign({ sx: {
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
            } }, { children: _jsxs(Resizer, Object.assign({ editor: editor, selected: selected, width: width, height: height, onResize: (width, height) => {
                    updateAttributes({
                        width,
                        height,
                    }, { addToHistory: true, preventUpdate: false });
                } }, { children: [_jsx(DesktopOnly, { children: selected && (_jsx(Flex, Object.assign({ sx: { position: "relative", justifyContent: "end" } }, { children: _jsx(Flex, Object.assign({ sx: {
                                    position: "absolute",
                                    top: -40,
                                    mb: 2,
                                    alignItems: "end",
                                } }, { children: _jsx(ToolbarGroup, { editor: editor, tools: [
                                        "imageAlignLeft",
                                        "imageAlignCenter",
                                        "imageAlignRight",
                                        "imageProperties",
                                    ], sx: {
                                        boxShadow: "menu",
                                        borderRadius: "default",
                                        bg: "background",
                                    } }) })) }))) }), selected && (_jsx(Icon, { className: "drag-handle", "data-drag-handle": true, draggable: true, path: Icons.dragHandle, sx: {
                            cursor: "grab",
                            position: "absolute",
                            top: 2,
                            left: 2,
                            zIndex: 999,
                        } })), _jsx(Image, Object.assign({ "data-drag-image": true, ref: imageRef, alt: alt, src: "/placeholder.svg", title: title, width: "100%", height: "100%", sx: {
                            bg: "bgSecondary",
                            border: selected
                                ? "2px solid var(--primary)"
                                : "2px solid transparent",
                            borderRadius: "default",
                        } }, props))] })) })) }));
}
function dataUriToBlobURL(dataurl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dataurl.startsWith("data:image"))
            return dataurl;
        const response = yield fetch(dataurl);
        const blob = yield response.blob();
        return URL.createObjectURL(blob);
    });
}
