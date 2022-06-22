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
import { Popup } from "../components/popup";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
import { EmbedPopup } from "../popups/embed-popup";
export function EmbedSettings(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("embed") || !isBottom)
        return null;
    return (_jsx(MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "embedSettings", tools: [] })));
}
export function EmbedAlignLeft(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            return editor.chain().focus().setEmbedAlignment({ align: "left" }).run();
        } })));
}
export function EmbedAlignRight(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            return editor.chain().focus().setEmbedAlignment({ align: "right" }).run();
        } })));
}
export function EmbedAlignCenter(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            return editor.chain().focus().setEmbedAlignment({ align: "center" }).run();
        } })));
}
export function EmbedProperties(props) {
    var editor = props.editor;
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var buttonRef = useRef();
    var embedNode = useMemo(function () { return findSelectedNode(editor, "embed"); }, []);
    var embed = ((embedNode === null || embedNode === void 0 ? void 0 : embedNode.attrs) || {});
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({ buttonRef: buttonRef, toggled: isOpen }, props, { onClick: function () { return setIsOpen(function (s) { return !s; }); } })), _jsx(ResponsivePresenter, __assign({ isOpen: isOpen, desktop: "menu", mobile: "sheet", onClose: function () { return setIsOpen(false); }, blocking: true, focusOnRender: false, position: {
                    target: buttonRef.current || "mouse",
                    align: "start",
                    location: "below",
                    yOffset: 10,
                    isTargetAbsolute: true,
                } }, { children: _jsx(Popup, __assign({ title: "Embed properties", onClose: function () {
                        setIsOpen(false);
                    } }, { children: _jsx(EmbedPopup, { title: "Embed properties", onClose: function () { return setIsOpen(false); }, embed: embed, onSourceChanged: function (src) { return editor.commands.setEmbedSource(src); }, onSizeChanged: function (size) { return editor.commands.setEmbedSize(size); } }) })) }))] }));
}
