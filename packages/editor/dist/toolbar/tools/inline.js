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
import { Button, Flex } from "rebass";
import { Input } from "@rebass/forms";
import { Popup } from "../components/popup";
function InlineTool(props) {
    var editor = props.editor, title = props.title, icon = props.icon, isToggled = props.isToggled, onClick = props.onClick;
    return (_jsx(ToolButton, { title: title, id: icon, icon: icon, onClick: function () { return onClick(editor); }, toggled: isToggled(editor) }));
}
export function Italic(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("italic"); }, onClick: function (editor) { return editor.chain().focus().toggleItalic().run(); } })));
}
export function Strikethrough(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("strikethrough"); }, onClick: function (editor) { return editor.chain().focus().toggleStrike().run(); } })));
}
export function Underline(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("underline"); }, onClick: function (editor) { return editor.chain().focus().toggleUnderline().run(); } })));
}
export function Code(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("code"); }, onClick: function (editor) { return editor.chain().focus().toggleCode().run(); } })));
}
export function Bold(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("bold"); }, onClick: function (editor) { return editor.chain().focus().toggleBold().run(); } })));
}
export function Subscript(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("subscript"); }, onClick: function (editor) { return editor.chain().focus().toggleSubscript().run(); } })));
}
export function Superscript(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function (editor) { return editor.isActive("superscript"); }, onClick: function (editor) { return editor.chain().focus().toggleSuperscript().run(); } })));
}
export function ClearFormatting(props) {
    return (_jsx(InlineTool, __assign({}, props, { isToggled: function () { return false; }, onClick: function (editor) {
            return editor.chain().focus().clearNodes().unsetAllMarks().run();
        } })));
}
export function Link(props) {
    var editor = props.editor, title = props.title, icon = props.icon;
    var buttonRef = useRef(null);
    var targetRef = useRef();
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var _b = __read(useState(), 2), href = _b[0], setHref = _b[1];
    var _c = __read(useState(), 2), text = _c[0], setText = _c[1];
    var currentUrl = editor.getAttributes("link").href;
    var isEditing = !!currentUrl;
    var onDone = useCallback(function (href, text) {
        if (!href)
            return;
        var commandChain = editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: href, target: "_blank" });
        if (text)
            commandChain = commandChain.insertContent(text).focus();
        commandChain.run();
        setIsOpen(false);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, { id: icon, buttonRef: buttonRef, title: title, icon: icon, onClick: function () {
                    if (isEditing)
                        setHref(currentUrl);
                    var _a = editor.state.selection, from = _a.from, to = _a.to, $from = _a.$from;
                    var selectedNode = $from.node();
                    var pos = selectedNode.isTextblock ? $from.before() : $from.pos;
                    var domNode = editor.view.nodeDOM(pos);
                    targetRef.current = domNode;
                    var selectedText = isEditing
                        ? selectedNode.textContent
                        : editor.state.doc.textBetween(from, to);
                    setText(selectedText);
                    setIsOpen(true);
                }, toggled: isOpen || !!isEditing }), _jsx(ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", position: {
                    target: targetRef.current || buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: "below",
                    align: "center",
                    yOffset: 5,
                }, title: isEditing ? "Edit link" : "Insert link", isOpen: isOpen, items: [], onClose: function () {
                    editor.commands.focus();
                    setIsOpen(false);
                }, focusOnRender: false }, { children: _jsx(Popup, __assign({ title: isEditing ? "Edit link" : "Insert link", onClose: function () { return setIsOpen(false); } }, { children: _jsx(LinkPopup, { href: href, text: text, isEditing: isEditing, onDone: function (_a) {
                            var href = _a.href, text = _a.text;
                            onDone(href, text);
                        } }) })) }))] }));
}
function LinkPopup(props) {
    var _text = props.text, _href = props.href, _a = props.isEditing, isEditing = _a === void 0 ? false : _a, onDone = props.onDone;
    var _b = __read(useState(_href || ""), 2), href = _b[0], setHref = _b[1];
    var _c = __read(useState(_text || ""), 2), text = _c[0], setText = _c[1];
    return (_jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column", width: ["auto", 250] } }, { children: [_jsx(Input, { type: "text", placeholder: "Link text", value: text, onChange: function (e) { return setText(e.target.value); } }), _jsx(Input, { type: "url", sx: { mt: 1 }, autoFocus: true, placeholder: "https://example.com/", value: href, onChange: function (e) { return setHref(e.target.value); } }), _jsx(Button, __assign({ variant: "primary", sx: {
                    alignSelf: ["stretch", "end", "end"],
                    my: 1,
                    mr: 1,
                }, onClick: function () { return onDone({ text: text, href: href }); } }, { children: isEditing ? "Save edits" : "Insert link" }))] })));
}
