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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useCallback, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { LinkPopup } from "../popups/link-popup";
import { useToolbarLocation } from "../stores/toolbar-store";
import { MoreTools } from "../components/more-tools";
import { useRefValue } from "../../hooks/use-ref-value";
import { findMark, selectionToOffset } from "../utils/prosemirror";
import { setTextSelection } from "prosemirror-utils";
import { Flex, Text } from "rebass";
export function LinkSettings(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("link") || !isBottom)
        return null;
    return (_jsx(MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "linkSettings", tools: ["openLink", "editLink", "removeLink"] })));
}
export function AddLink(props) {
    var editor = props.editor;
    var isActive = props.editor.isActive("link");
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
    }, []);
    if (isActive)
        return _jsx(EditLink, __assign({}, props));
    return (_jsx(LinkTool, __assign({}, props, { onDone: onDone, onClick: function () {
            var _a = editor.state.selection, from = _a.from, to = _a.to;
            var selectedText = editor.state.doc.textBetween(from, to);
            return { text: selectedText };
        } })));
}
export function EditLink(props) {
    var editor = props.editor, _selectedNode = props.selectedNode;
    var selectedNode = useRefValue(_selectedNode || selectionToOffset(editor.state.selection));
    var onDone = useCallback(function (href, text) {
        if (!href || !editor.current)
            return;
        var _a = selectedNode.current, from = _a.from, node = _a.node, to = _a.to;
        var mark = findMark(node, "link");
        if (!mark)
            return;
        editor.current
            .chain()
            .command(function (_a) {
            var tr = _a.tr;
            tr.removeMark(from, to, mark.type);
            tr.addMark(from, to, mark.type.create({ href: href }));
            tr.insertText(text || node.textContent, from, to);
            setTextSelection(tr.mapping.map(from))(tr);
            return true;
        })
            .focus(undefined, { scrollIntoView: true })
            .run();
    }, []);
    return (_jsx(LinkTool, __assign({}, props, { isEditing: true, onDone: onDone, onClick: function () {
            var node = selectedNode.current.node;
            var selectedText = node.textContent;
            var mark = findMark(node, "link");
            if (!mark)
                return;
            return { text: selectedText, href: mark.attrs.href };
        } })));
}
export function RemoveLink(props) {
    var editor = props.editor, selectedNode = props.selectedNode;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            if (selectedNode)
                editor.commands.setTextSelection(selectedNode.from);
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetLink().run();
        } })));
}
export function OpenLink(props) {
    var editor = props.editor, selectedNode = props.selectedNode;
    var node = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.node) || editor.state.selection.$anchor.node();
    var link = selectedNode ? findMark(node, "link") : null;
    if (!link)
        return null;
    var href = link === null || link === void 0 ? void 0 : link.attrs.href;
    return (_jsxs(Flex, __assign({ sx: { alignItems: "center" } }, { children: [_jsx(Text, __assign({ as: "a", href: href, target: "_blank", variant: "body", sx: { mr: 1 } }, { children: href })), _jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { return window.open(href, "_blank"); } }))] })));
}
function LinkTool(props) {
    var isEditing = props.isEditing, onClick = props.onClick, onDone = props.onDone;
    var buttonRef = useRef(null);
    var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var _b = __read(useState(), 2), href = _b[0], setHref = _b[1];
    var _c = __read(useState(), 2), text = _c[0], setText = _c[1];
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, __assign({}, props, { buttonRef: buttonRef, onClick: function () {
                    var result = onClick();
                    if (!result)
                        return;
                    var text = result.text, href = result.href;
                    setHref(href);
                    setText(text);
                    setIsOpen(true);
                }, toggled: isOpen })), _jsx(ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: "below",
                    align: "center",
                    yOffset: 5,
                }, title: isEditing ? "Edit link" : "Insert link", isOpen: isOpen, items: [], onClose: function () { return setIsOpen(false); }, focusOnRender: false }, { children: _jsx(LinkPopup, { href: href, text: text, isEditing: isEditing, onClose: function () { return setIsOpen(false); }, onDone: function (_a) {
                        var href = _a.href, text = _a.text;
                        onDone(href, text);
                        setIsOpen(false);
                    } }) }))] }));
}
