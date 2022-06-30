"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLink = exports.RemoveLink = exports.EditLink = exports.AddLink = exports.LinkSettings = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
var react_1 = require("react");
var responsive_1 = require("../../components/responsive");
var linkpopup_1 = require("../popups/linkpopup");
var toolbarstore_1 = require("../stores/toolbarstore");
var moretools_1 = require("../components/moretools");
var useRefValue_1 = require("../../hooks/useRefValue");
var prosemirror_1 = require("../utils/prosemirror");
var prosemirror_utils_1 = require("prosemirror-utils");
var rebass_1 = require("rebass");
function LinkSettings(props) {
    var editor = props.editor;
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("link") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "linkSettings", tools: ["openLink", "editLink", "removeLink"] })));
}
exports.LinkSettings = LinkSettings;
function AddLink(props) {
    var editor = props.editor;
    var isActive = props.editor.isActive("link");
    var onDone = (0, react_1.useCallback)(function (href, text) {
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
        return (0, jsx_runtime_1.jsx)(EditLink, __assign({}, props));
    return ((0, jsx_runtime_1.jsx)(LinkTool, __assign({}, props, { onDone: onDone, onClick: function () {
            var _a = editor.state.selection, from = _a.from, to = _a.to;
            var selectedText = editor.state.doc.textBetween(from, to);
            return { text: selectedText };
        } })));
}
exports.AddLink = AddLink;
function EditLink(props) {
    var editor = props.editor, _selectedNode = props.selectedNode;
    var selectedNode = (0, useRefValue_1.useRefValue)(_selectedNode || (0, prosemirror_1.selectionToOffset)(editor.state.selection));
    var onDone = (0, react_1.useCallback)(function (href, text) {
        if (!href || !editor.current)
            return;
        var _a = selectedNode.current, from = _a.from, node = _a.node, to = _a.to;
        var mark = (0, prosemirror_1.findMark)(node, "link");
        if (!mark)
            return;
        editor.current
            .chain()
            .command(function (_a) {
            var tr = _a.tr;
            tr.removeMark(from, to, mark.type);
            tr.addMark(from, to, mark.type.create({ href: href }));
            tr.insertText(text || node.textContent, from, to);
            (0, prosemirror_utils_1.setTextSelection)(tr.mapping.map(from))(tr);
            return true;
        })
            .focus(undefined, { scrollIntoView: true })
            .run();
    }, []);
    return ((0, jsx_runtime_1.jsx)(LinkTool, __assign({}, props, { isEditing: true, onDone: onDone, onClick: function () {
            var node = selectedNode.current.node;
            var selectedText = node.textContent;
            var mark = (0, prosemirror_1.findMark)(node, "link");
            if (!mark)
                return;
            return { text: selectedText, href: mark.attrs.href };
        } })));
}
exports.EditLink = EditLink;
function RemoveLink(props) {
    var editor = props.editor, selectedNode = props.selectedNode;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a, _b;
            if (selectedNode)
                (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setTextSelection(selectedNode.from);
            (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetLink().run();
        } })));
}
exports.RemoveLink = RemoveLink;
function OpenLink(props) {
    var editor = props.editor, selectedNode = props.selectedNode;
    var node = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.node) || editor.state.selection.$anchor.node();
    var link = selectedNode ? (0, prosemirror_1.findMark)(node, "link") : null;
    if (!link)
        return null;
    var href = link === null || link === void 0 ? void 0 : link.attrs.href;
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ as: "a", href: href, target: "_blank", variant: "body", sx: { mr: 1 } }, { children: href })), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () { return window.open(href, "_blank"); } }))] })));
}
exports.OpenLink = OpenLink;
function LinkTool(props) {
    var isEditing = props.isEditing, onClick = props.onClick, onDone = props.onDone;
    var buttonRef = (0, react_1.useRef)(null);
    var _a = __read((0, react_1.useState)(false), 2), isOpen = _a[0], setIsOpen = _a[1];
    var _b = __read((0, react_1.useState)(), 2), href = _b[0], setHref = _b[1];
    var _c = __read((0, react_1.useState)(), 2), text = _c[0], setText = _c[1];
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { buttonRef: buttonRef, onClick: function () {
                    var result = onClick();
                    if (!result)
                        return;
                    var text = result.text, href = result.href;
                    setHref(href);
                    setText(text);
                    setIsOpen(true);
                }, toggled: isOpen })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: "below",
                    align: "center",
                    yOffset: 5,
                }, title: isEditing ? "Edit link" : "Insert link", isOpen: isOpen, items: [], onClose: function () { return setIsOpen(false); }, focusOnRender: false }, { children: (0, jsx_runtime_1.jsx)(linkpopup_1.LinkPopup, { href: href, text: text, isEditing: isEditing, onClose: function () { return setIsOpen(false); }, onDone: function (_a) {
                        var href = _a.href, text = _a.text;
                        onDone(href, text);
                        setIsOpen(false);
                    } }) }))] }));
}
