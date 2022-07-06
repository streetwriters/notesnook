"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenLink = exports.RemoveLink = exports.EditLink = exports.AddLink = exports.LinkSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const react_1 = require("react");
const responsive_1 = require("../../components/responsive");
const linkpopup_1 = require("../popups/linkpopup");
const toolbarstore_1 = require("../stores/toolbarstore");
const moretools_1 = require("../components/moretools");
const useRefValue_1 = require("../../hooks/useRefValue");
const prosemirror_1 = require("../utils/prosemirror");
const prosemirror_utils_1 = require("prosemirror-utils");
const rebass_1 = require("rebass");
function LinkSettings(props) {
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("link") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "linkSettings", tools: ["openLink", "editLink", "removeLink"] })));
}
exports.LinkSettings = LinkSettings;
function AddLink(props) {
    const { editor } = props;
    const isActive = props.editor.isActive("link");
    const onDone = (0, react_1.useCallback)((href, text) => {
        var _a;
        if (!href)
            return;
        let commandChain = (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus();
        if (!commandChain)
            return;
        commandChain
            .extendMarkRange("link")
            .toggleLink({ href, target: "_blank" })
            .insertContent(text || href)
            .focus()
            .unsetMark("link")
            .insertContent(" ")
            .run();
    }, []);
    if (isActive)
        return (0, jsx_runtime_1.jsx)(EditLink, Object.assign({}, props));
    return ((0, jsx_runtime_1.jsx)(LinkTool, Object.assign({}, props, { onDone: onDone, onClick: () => {
            let { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to);
            return { text: selectedText };
        } })));
}
exports.AddLink = AddLink;
function EditLink(props) {
    const { editor, selectedNode: _selectedNode } = props;
    const selectedNode = (0, useRefValue_1.useRefValue)(_selectedNode || (0, prosemirror_1.selectionToOffset)(editor.state.selection));
    const onDone = (0, react_1.useCallback)((href, text) => {
        if (!href || !editor.current)
            return;
        const { from, node, to } = selectedNode.current;
        const mark = (0, prosemirror_1.findMark)(node, "link");
        if (!mark)
            return;
        editor.current
            .chain()
            .command(({ tr }) => {
            tr.removeMark(from, to, mark.type);
            tr.addMark(from, to, mark.type.create({ href }));
            tr.insertText(text || node.textContent, from, to);
            (0, prosemirror_utils_1.setTextSelection)(tr.mapping.map(from))(tr);
            return true;
        })
            .focus(undefined, { scrollIntoView: true })
            .run();
    }, []);
    return ((0, jsx_runtime_1.jsx)(LinkTool, Object.assign({}, props, { isEditing: true, onDone: onDone, onClick: () => {
            const { node } = selectedNode.current;
            const selectedText = node.textContent;
            const mark = (0, prosemirror_1.findMark)(node, "link");
            if (!mark)
                return;
            return { text: selectedText, href: mark.attrs.href };
        } })));
}
exports.EditLink = EditLink;
function RemoveLink(props) {
    const { editor, selectedNode } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a, _b;
            if (selectedNode)
                (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setTextSelection(selectedNode.from);
            (_b = editor.current) === null || _b === void 0 ? void 0 : _b.chain().focus().unsetLink().run();
        } })));
}
exports.RemoveLink = RemoveLink;
function OpenLink(props) {
    const { editor, selectedNode } = props;
    const node = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.node) || editor.state.selection.$anchor.node();
    const link = selectedNode ? (0, prosemirror_1.findMark)(node, "link") : null;
    if (!link)
        return null;
    const href = link === null || link === void 0 ? void 0 : link.attrs.href;
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ as: "a", href: href, target: "_blank", variant: "body", sx: { mr: 1 } }, { children: href })), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => window.open(href, "_blank") }))] })));
}
exports.OpenLink = OpenLink;
function LinkTool(props) {
    const { isEditing, onClick, onDone, editor } = props, toolProps = __rest(props, ["isEditing", "onClick", "onDone", "editor"]);
    const buttonRef = (0, react_1.useRef)(null);
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [href, setHref] = (0, react_1.useState)();
    const [text, setText] = (0, react_1.useState)();
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { buttonRef: buttonRef, onClick: () => {
                    const result = onClick();
                    if (!result)
                        return;
                    const { text, href } = result;
                    setHref(href);
                    setText(text);
                    setIsOpen(true);
                }, toggled: isOpen })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ mobile: "sheet", desktop: "menu", position: {
                    target: buttonRef.current || undefined,
                    isTargetAbsolute: true,
                    location: "below",
                    align: "center",
                    yOffset: 5,
                }, title: isEditing ? "Edit link" : "Insert link", isOpen: isOpen, items: [], onClose: () => {
                    var _a;
                    setIsOpen(false);
                    (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.focus();
                }, focusOnRender: false }, { children: (0, jsx_runtime_1.jsx)(linkpopup_1.LinkPopup, { href: href, text: text, isEditing: isEditing, onClose: () => setIsOpen(false), onDone: ({ href, text }) => {
                        onDone(href, text);
                        setIsOpen(false);
                    } }) }))] }));
}
