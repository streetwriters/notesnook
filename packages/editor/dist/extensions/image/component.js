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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Image, Text } from "rebass";
import { NodeViewWrapper } from "@tiptap/react";
import { ThemeProvider } from "emotion-theming";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { useCallback, useEffect, useRef, useState } from "react";
import { Popup } from "../../toolbar/components/popup";
import { Toggle } from "../../components/toggle";
import { Input } from "@rebass/forms";
export function ImageComponent(props) {
    var _a = props.node
        .attrs, src = _a.src, alt = _a.alt, title = _a.title, width = _a.width, height = _a.height, align = _a.align, float = _a.float;
    var editor = props.editor, updateAttributes = props.updateAttributes;
    var imageRef = useRef();
    var isActive = editor.isActive("image", { src: src });
    var _b = useState(), isToolbarVisible = _b[0], setIsToolbarVisible = _b[1];
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
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var onSizeChange = useCallback(function (newWidth, newHeight) {
        var size = newWidth
            ? {
                width: newWidth,
                height: newWidth * (height / width),
            }
            : newHeight
                ? {
                    width: newHeight * (width / height),
                    height: newHeight,
                }
                : {
                    width: 0,
                    height: 0,
                };
        editor.chain().setImageSize(size).run();
    }, [width, height]);
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
                        } }, { children: _jsx(ToolButton, { toggled: isOpen, title: "Image properties", id: "imageProperties", icon: "more", onClick: function () { return setIsOpen(function (s) { return !s; }); } }) }))] })), isOpen && (_jsx(Popup, __assign({ title: "Image properties", action: {
                    icon: "close",
                    onClick: function () {
                        setIsOpen(false);
                    },
                } }, { children: _jsxs(Flex, __assign({ sx: { width: 200, flexDirection: "column", p: 1 } }, { children: [_jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center" } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: "Floating?" })), _jsx(Toggle, { checked: float, onClick: function () {
                                        return editor
                                            .chain()
                                            .setImageAlignment({ float: !float, align: "left" })
                                            .run();
                                    } })] })), _jsxs(Flex, __assign({ sx: { alignItems: "center", mt: 2 } }, { children: [_jsx(Input, { type: "number", placeholder: "Width", value: width, sx: {
                                        mr: 2,
                                        p: 1,
                                        fontSize: "body",
                                    }, onChange: function (e) { return onSizeChange(e.target.valueAsNumber); } }), _jsx(Input, { type: "number", placeholder: "Height", value: height, sx: { p: 1, fontSize: "body" }, onChange: function (e) {
                                        return onSizeChange(undefined, e.target.valueAsNumber);
                                    } })] }))] })) })))] })));
}
