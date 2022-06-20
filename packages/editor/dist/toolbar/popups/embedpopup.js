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
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button, Flex, Text } from "rebass";
import { useCallback, useEffect, useState } from "react";
import { Popup } from "../components/popup";
import { Input, Textarea } from "@rebass/forms";
import { convertUrlToEmbedUrl } from "@social-embed/lib";
import { InlineInput } from "../../components/inline-input";
import { Tabs, Tab } from "../../components/tabs";
export function EmbedPopup(props) {
    var onClose = props.onClose, onSizeChanged = props.onSizeChanged, onSourceChanged = props.onSourceChanged, title = props.title, embed = props.embed;
    var _a = __read(useState((embed === null || embed === void 0 ? void 0 : embed.width) || 300), 2), width = _a[0], setWidth = _a[1];
    var _b = __read(useState((embed === null || embed === void 0 ? void 0 : embed.height) || 150), 2), height = _b[0], setHeight = _b[1];
    var _c = __read(useState((embed === null || embed === void 0 ? void 0 : embed.src) || ""), 2), src = _c[0], setSrc = _c[1];
    var _d = __read(useState("url"), 2), embedSource = _d[0], setEmbedSource = _d[1];
    var _e = __read(useState(null), 2), error = _e[0], setError = _e[1];
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
        setWidth(size.width);
        setHeight(size.height);
        if (onSizeChanged)
            onSizeChanged(size);
    }, [width, height]);
    useEffect(function () {
        onSourceChanged && onSourceChanged(src);
    }, [onSourceChanged, src]);
    return (_jsx(Popup, __assign({ title: title, onClose: function () { return onClose(); } }, { children: _jsxs(Flex, __assign({ sx: { flexDirection: "column", width: ["auto", 300] } }, { children: [error && (_jsxs(Text, __assign({ variant: "error", sx: {
                        bg: "errorBg",
                        color: "error",
                        p: 1,
                        borderRadius: "default",
                    } }, { children: ["Error: ", error] }))), _jsxs(Tabs, __assign({ activeIndex: 0, containerProps: { sx: { mx: 1, mb: 1, flexDirection: "column" } }, onTabChanged: function (index) { return setEmbedSource(index === 0 ? "url" : "code"); } }, { children: [_jsxs(Tab, __assign({ title: "From URL" }, { children: [_jsx(Input, { placeholder: "Enter embed source URL", value: src, autoFocus: true, onChange: function (e) { return setSrc(e.target.value); }, autoCapitalize: "none", sx: { fontSize: "body" } }), _jsxs(Flex, __assign({ sx: { alignItems: "center", mt: 1 } }, { children: [_jsx(InlineInput, { containerProps: { sx: { mr: 1 } }, label: "width", type: "number", placeholder: "Width", value: width, sx: {
                                                mr: 1,
                                                fontSize: "body",
                                            }, onChange: function (e) { return onSizeChange(e.target.valueAsNumber); } }), _jsx(InlineInput, { label: "height", type: "number", placeholder: "Height", value: height, sx: { fontSize: "body" }, onChange: function (e) {
                                                return onSizeChange(undefined, e.target.valueAsNumber);
                                            } })] }))] })), _jsx(Tab, __assign({ title: "From code" }, { children: _jsx(Textarea, { autoFocus: true, variant: "forms.input", sx: { fontSize: "subBody", fontFamily: "monospace" }, minHeight: [200, 100], onChange: function (e) { return setSrc(e.target.value); }, placeholder: "Paste embed code here. Only iframes are supported." }) }))] })), _jsx(Button, __assign({ variant: "primary", sx: {
                        alignSelf: ["stretch", "end", "end"],
                        my: 1,
                        mr: 1,
                        ml: [1, 0],
                        py: 2,
                    }, onClick: function () {
                        setError(null);
                        var _src = src;
                        var _width = width;
                        var _height = height;
                        if (embedSource === "code") {
                            var document_1 = new DOMParser().parseFromString(src, "text/html");
                            if (document_1.getElementsByTagName("iframe").length <= 0)
                                return setError("Embed code must include an iframe.");
                            var srcValue = getAttribute(document_1, "src");
                            if (!srcValue)
                                return setError("Embed code must include an iframe with an src attribute.");
                            _src = srcValue;
                            var widthValue = getAttribute(document_1, "width");
                            if (widthValue && !isNaN(parseInt(widthValue)))
                                _width = parseInt(widthValue);
                            var heightValue = getAttribute(document_1, "height");
                            if (heightValue && !isNaN(parseInt(heightValue)))
                                _height = parseInt(heightValue);
                        }
                        var convertedUrl = convertUrlToEmbedUrl(_src);
                        if (!!convertedUrl)
                            _src = convertedUrl;
                        onClose({
                            height: _height,
                            width: _width,
                            src: _src,
                        });
                    } }, { children: title }))] })) })));
}
function getAttribute(document, id) {
    var element = document.querySelector("[".concat(id, "]"));
    if (!element)
        return null;
    var attribute = element.getAttribute(id);
    return attribute;
}
