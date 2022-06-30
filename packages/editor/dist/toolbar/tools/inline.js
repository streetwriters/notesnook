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
import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
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
export function CodeRemove(props) {
    var editor = props.editor;
    var isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("code") || !isBottom)
        return null;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("code").run(); } })));
}
export function Math(props) {
    var editor = props.editor;
    return (_jsx(ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertMathInline().run(); } })));
}
