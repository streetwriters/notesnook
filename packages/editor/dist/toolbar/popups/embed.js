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
import { Flex, Text } from "rebass";
import { useCallback, useEffect, useState } from "react";
import { Popup } from "../../toolbar/components/popup";
import { Toggle } from "../../components/toggle";
import { Input } from "@rebass/forms";
export function EmbedPopup(props) {
    var onClose = props.onClose, onSizeChanged = props.onSizeChanged, onFloatingChanged = props.onFloatingChanged, onSourceChanged = props.onSourceChanged, title = props.title, icon = props.icon, embed = props.embed;
    var _a = __read(useState((embed === null || embed === void 0 ? void 0 : embed.width) || 300), 2), width = _a[0], setWidth = _a[1];
    var _b = __read(useState((embed === null || embed === void 0 ? void 0 : embed.height) || 150), 2), height = _b[0], setHeight = _b[1];
    var _c = __read(useState((embed === null || embed === void 0 ? void 0 : embed.src) || ""), 2), src = _c[0], setSrc = _c[1];
    var _d = __read(useState((embed === null || embed === void 0 ? void 0 : embed.float) || false), 2), isFloating = _d[0], setIsFloating = _d[1];
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
        onFloatingChanged && onFloatingChanged(isFloating);
    }, [onFloatingChanged, isFloating]);
    useEffect(function () {
        onSourceChanged && onSourceChanged(src);
    }, [onSourceChanged, src]);
    return (_jsx(Popup, __assign({ title: title, action: {
            icon: icon,
            onClick: function () { return onClose({ height: height, width: width, src: src, float: isFloating }); },
        } }, { children: _jsxs(Flex, __assign({ sx: { width: 200, flexDirection: "column", p: 1 } }, { children: [_jsx(Input, { value: src, onChange: function (e) { return setSrc(e.target.value); } }), _jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center" } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: "Floating?" })), _jsx(Toggle, { checked: isFloating, onClick: function () { return setIsFloating(function (s) { return !s; }); } })] })), _jsxs(Flex, __assign({ sx: { alignItems: "center", mt: 2 } }, { children: [_jsx(Input, { type: "number", placeholder: "Width", value: width, sx: {
                                mr: 2,
                                p: 1,
                                fontSize: "body",
                            }, onChange: function (e) { return onSizeChange(e.target.valueAsNumber); } }), _jsx(Input, { type: "number", placeholder: "Height", value: height, sx: { p: 1, fontSize: "body" }, onChange: function (e) { return onSizeChange(undefined, e.target.valueAsNumber); } })] }))] })) })));
}
