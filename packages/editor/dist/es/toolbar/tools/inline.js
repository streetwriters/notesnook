import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
export function Italic(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("italic"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleItalic().run(); } })));
}
export function Strikethrough(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("strike"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleStrike().run(); } })));
}
export function Underline(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("underline"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleUnderline().run(); } })));
}
export function Code(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("code"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleCode().run(); } })));
}
export function Bold(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("bold"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleBold().run(); } })));
}
export function Subscript(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("subscript"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSubscript().run(); } })));
}
export function Superscript(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: editor.isActive("superscript"), onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().toggleSuperscript().run(); } })));
}
export function ClearFormatting(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().clearNodes().unsetAllMarks().unsetMark("link").run();
        } })));
}
export function CodeRemove(props) {
    const { editor } = props;
    const isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("code") || !isBottom)
        return null;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().unsetMark("code").run(); } })));
}
export function Math(props) {
    const { editor } = props;
    return (_jsx(ToolButton, Object.assign({}, props, { toggled: false, onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().insertMathInline().run(); } })));
}
