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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Image } from "rebass";
import { NodeViewWrapper } from "@tiptap/react";
import { ThemeProvider } from "emotion-theming";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { useEffect, useRef, useState } from "react";
import { PopupPresenter, } from "../../components/menu/menu";
import { Popup } from "../../toolbar/components/popup";
import { ImageProperties } from "../../toolbar/popups/image-properties";
export function ImageComponent(props) {
    var _a = props.node
        .attrs, src = _a.src, alt = _a.alt, title = _a.title, width = _a.width, height = _a.height, align = _a.align, float = _a.float;
    var editor = props.editor, updateAttributes = props.updateAttributes;
    var imageRef = useRef();
    var isActive = editor.isActive("image", { src: src });
    var _b = __read(useState(), 2), isToolbarVisible = _b[0], setIsToolbarVisible = _b[1];
    var theme = editor.storage.theme;
    useEffect(function () {
        setIsToolbarVisible(isActive);
    }, [isActive]);
    return (_jsx(NodeViewWrapper, { children: _jsx(ThemeProvider, __assign({ theme: theme }, { children: _jsx(Box, __assign({ sx: {
                    display: float ? "block" : "flex",
                    justifyContent: float
                        ? "stretch"
                        : align === "center"
                            ? "center"
                            : align === "left"
                                ? "start"
                                : "end",
                } }, { children: _jsxs(Resizable, __assign({ style: {
                        float: float ? (align === "left" ? "left" : "right") : "none",
                    }, size: {
                        height: height || "auto",
                        width: width || "auto",
                    }, maxWidth: "100%", onResizeStop: function (e, direction, ref, d) {
                        updateAttributes({
                            width: ref.clientWidth,
                            height: ref.clientHeight,
                        });
                    }, lockAspectRatio: true }, { children: [_jsx(Flex, __assign({ sx: { position: "relative", justifyContent: "end" } }, { children: isToolbarVisible && (_jsx(ImageToolbar, { editor: editor, float: float, align: align, height: height || 0, width: width || 0 })) })), _jsx(Image, __assign({ ref: imageRef, src: src, alt: alt, title: title, width: "100%", height: "100%", sx: {
                                border: isActive
                                    ? "2px solid var(--primary)"
                                    : "2px solid transparent",
                                borderRadius: "default",
                            } }, props))] })) })) })) }));
}
function ImageToolbar(props) {
    var editor = props.editor, float = props.float, height = props.height, width = props.width;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    return (_jsxs(Flex, __assign({ sx: {
            flexDirection: "column",
            position: "absolute",
            top: -40,
            mb: 2,
            zIndex: 9999,
            alignItems: "end",
        } }, { children: [_jsxs(Flex, __assign({ sx: {
                    bg: "background",
                    boxShadow: "menu",
                    flexWrap: "nowrap",
                    borderRadius: "default",
                    mb: 2,
                } }, { children: [_jsxs(Flex, __assign({ className: "toolbar-group", sx: {
                            pr: 1,
                            mr: 1,
                            borderRight: "1px solid var(--border)",
                            ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                        } }, { children: [_jsx(ToolButton, { toggled: false, title: "Align left", id: "alignLeft", icon: "alignLeft", onClick: function () {
                                    return editor.chain().focus().setImageAlignment({ align: "left" }).run();
                                } }), float ? null : (_jsx(ToolButton, { toggled: false, title: "Align center", id: "alignCenter", icon: "alignCenter", onClick: function () {
                                    return editor
                                        .chain()
                                        .focus()
                                        .setImageAlignment({ align: "center" })
                                        .run();
                                } })), _jsx(ToolButton, { toggled: false, title: "Align right", id: "alignRight", icon: "alignRight", onClick: function () {
                                    return editor.chain().focus().setImageAlignment({ align: "right" }).run();
                                } })] })), _jsx(Flex, __assign({ className: "toolbar-group", sx: {
                            pr: 1,
                            mr: 1,
                            borderRight: "1px solid var(--border)",
                            ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
                        } }, { children: _jsx(ToolButton, { toggled: isOpen, title: "Image properties", id: "imageProperties", icon: "more", onClick: function () { return setIsOpen(function (s) { return !s; }); } }) }))] })), _jsx(PopupPresenter, __assign({ mobile: "sheet", desktop: "none", isOpen: isOpen, onClose: function () { return setIsOpen(false); }, blocking: false }, { children: _jsx(Popup, __assign({ title: "Image properties", action: {
                        icon: "close",
                        onClick: function () {
                            setIsOpen(false);
                        },
                    } }, { children: _jsx(ImageProperties, __assign({}, props)) })) }))] })));
}
