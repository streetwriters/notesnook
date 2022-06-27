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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties";
import { findSelectedNode } from "../utils/prosemirror";
export function ImageSettings(props) {
    var _a, _b;
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("image") || !isBottom)
        return null;
    return (_jsx(MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "imageSettings", tools: ((_b = (_a = findSelectedNode(editor, "image")) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.float)
            ? ["imageAlignLeft", "imageAlignRight", "imageProperties"]
            : [
                "imageAlignLeft",
                "imageAlignCenter",
                "imageAlignRight",
                "imageProperties",
            ] })));
}
export function ImageAlignLeft(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "left" }).run();
        } })));
}
export function ImageAlignRight(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "right" }).run();
        } })));
}
export function ImageAlignCenter(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setImageAlignment({ align: "center" }).run();
        } })));
}
export function ImageProperties(props) {
    var editor = props.editor;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef();
    // TODO: defer until user opens the popup
    var image = useMemo(function () { return findSelectedNode(editor, "image"); }, []);
    var _b = ((image === null || image === void 0 ? void 0 : image.attrs) ||
        {}), float = _b.float, align = _b.align, width = _b.width, height = _b.height;
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: function () { return setIsOpen(function (s) { return !s; }); } })), _jsx(ResponsivePresenter, __assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: function () { return setIsOpen(false); }, blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: _jsx(ImagePropertiesPopup, { editor: editor, height: height, width: width, align: align, float: float, onClose: function () { return setIsOpen(false); } }) }))] }));
}
