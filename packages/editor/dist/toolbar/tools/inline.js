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
import { useCallback, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { Popup } from "../components/popup";
import { LinkPopup } from "../popups/link-popup";
import { useToolbarLocation } from "../stores/toolbar-store";
export function Italic(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("italic"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleItalic().run(); } })));
}
export function Strikethrough(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("strike"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleStrike().run(); } })));
}
export function Underline(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("underline"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleUnderline().run(); } })));
}
export function Code(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("code"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCode().run(); } })));
}
export function Bold(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("bold"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBold().run(); } })));
}
export function Subscript(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("subscript"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSubscript().run(); } })));
}
export function Superscript(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: editor.isActive("superscript"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSuperscript().run(); } })));
}
export function ClearFormatting(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().clearNodes().unsetAllMarks().unsetMark("link").run();
        } })));
}
export function LinkRemove(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("link") || !isBottom)
        return null;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("link").run(); } })));
}
export function CodeRemove(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("code") || !isBottom)
        return null;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("code").run(); } })));
}
export function Link(props) {
    var editor = props.editor, title = props.title, icon = props.icon;
    var buttonRef = useRef(null);
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var _b = __read(useState(), 2), href = _b[0], setHref = _b[1];
    var _c = __read(useState(), 2), text = _c[0], setText = _c[1];
    var currentUrl = editor.getAttributes("link").href;
    var isEditing = !!currentUrl;
    var onDone = useCallback(function (href, text) {
        var _a;
        if (!href)
            return;
        var commandChain = (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus();
        if (!commandChain)
            return;
        commandChain
            .extendMarkRange("link")
            .toggleLink({ href: href, target: "_blank" })
            .insertContent(text || href)
            .focus()
            .unsetMark("link")
            .insertContent(" ")
            .run();
        setIsOpen(false);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, { id: icon, buttonRef: buttonRef, title: title, icon: isEditing ? "linkEdit" : icon, onClick: function () {
                    if (isEditing)
                        setHref(currentUrl);
                    var _a = editor.state.selection, from = _a.from, to = _a.to, $from = _a.$from;
                    var selectedNode = $from.node();
                    var selectedText = isEditing
                        ? selectedNode.textContent
                        : editor.state.doc.textBetween(from, to);
                    setText(selectedText);
                    setIsOpen(true);
                }, toggled: isOpen || !!isEditing }), _jsx(ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: "below",
                    align: "center",
                    yOffset: 5,
                }, title: isEditing ? "Edit link" : "Insert link", isOpen: isOpen, items: [], onClose: function () { return setIsOpen(false); }, focusOnRender: false }, { children: _jsx(Popup, __assign({ title: isEditing ? "Edit link" : "Insert link", onClose: function () { return setIsOpen(false); } }, { children: _jsx(LinkPopup, { href: href, text: text, isEditing: isEditing, onDone: function (_a) {
                            var href = _a.href, text = _a.text;
                            onDone(href, text);
                        } }) })) }))] }));
}
