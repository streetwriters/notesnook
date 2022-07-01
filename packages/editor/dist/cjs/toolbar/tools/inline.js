"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Math = exports.CodeRemove = exports.ClearFormatting = exports.Superscript = exports.Subscript = exports.Bold = exports.Code = exports.Underline = exports.Strikethrough = exports.Italic = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const toolbarstore_1 = require("../stores/toolbarstore");
function Italic(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("italic"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleItalic().run(); } })));
}
exports.Italic = Italic;
function Strikethrough(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("strike"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleStrike().run(); } })));
}
exports.Strikethrough = Strikethrough;
function Underline(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("underline"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleUnderline().run(); } })));
}
exports.Underline = Underline;
function Code(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("code"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCode().run(); } })));
}
exports.Code = Code;
function Bold(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("bold"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBold().run(); } })));
}
exports.Bold = Bold;
function Subscript(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("subscript"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSubscript().run(); } })));
}
exports.Subscript = Subscript;
function Superscript(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: editor.isActive("superscript"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSuperscript().run(); } })));
}
exports.Superscript = Superscript;
function ClearFormatting(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().clearNodes().unsetAllMarks().unsetMark("link").run();
        } })));
}
exports.ClearFormatting = ClearFormatting;
function CodeRemove(props) {
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("code") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("code").run(); } })));
}
exports.CodeRemove = CodeRemove;
function Math(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertMathInline().run(); } })));
}
exports.Math = Math;
