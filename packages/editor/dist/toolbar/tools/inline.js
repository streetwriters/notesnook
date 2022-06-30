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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Math = exports.CodeRemove = exports.ClearFormatting = exports.Superscript = exports.Subscript = exports.Bold = exports.Code = exports.Underline = exports.Strikethrough = exports.Italic = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
var toolbarstore_1 = require("../stores/toolbarstore");
function Italic(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("italic"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleItalic().run(); } })));
}
exports.Italic = Italic;
function Strikethrough(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("strike"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleStrike().run(); } })));
}
exports.Strikethrough = Strikethrough;
function Underline(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("underline"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleUnderline().run(); } })));
}
exports.Underline = Underline;
function Code(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("code"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCode().run(); } })));
}
exports.Code = Code;
function Bold(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("bold"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBold().run(); } })));
}
exports.Bold = Bold;
function Subscript(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("subscript"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSubscript().run(); } })));
}
exports.Subscript = Subscript;
function Superscript(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: editor.isActive("superscript"), onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSuperscript().run(); } })));
}
exports.Superscript = Superscript;
function ClearFormatting(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().clearNodes().unsetAllMarks().unsetMark("link").run();
        } })));
}
exports.ClearFormatting = ClearFormatting;
function CodeRemove(props) {
    var editor = props.editor;
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("code") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("code").run(); } })));
}
exports.CodeRemove = CodeRemove;
function Math(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { toggled: false, onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertMathInline().run(); } })));
}
exports.Math = Math;
