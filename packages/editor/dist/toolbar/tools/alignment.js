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
import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
function AlignmentTool(props) {
    var editor = props.editor, alignment = props.alignment, toolProps = __rest(props, ["editor", "alignment"]);
    return (_jsx(ToolButton, __assign({}, toolProps, { onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextAlign(alignment).run(); }, toggled: editor.isActive({ textAlign: alignment }) })));
}
export function AlignCenter(props) {
    return _jsx(AlignmentTool, __assign({ alignment: "center" }, props));
}
export function AlignLeft(props) {
    return _jsx(AlignmentTool, __assign({ alignment: "left" }, props));
}
export function AlignRight(props) {
    return _jsx(AlignmentTool, __assign({ alignment: "right" }, props));
}
export function AlignJustify(props) {
    return _jsx(AlignmentTool, __assign({ alignment: "justify" }, props));
}
