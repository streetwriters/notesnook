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
function TextDirectionTool(props) {
    var editor = props.editor, direction = props.direction, toolProps = __rest(props, ["editor", "direction"]);
    return (_jsx(ToolButton, __assign({}, toolProps, { onClick: function () { return editor.chain().focus().setTextDirection(direction).run(); }, toggled: editor.isActive({ textDirection: direction }) })));
}
export function RightToLeft(props) {
    return _jsx(TextDirectionTool, __assign({ direction: "rtl" }, props));
}
export function LeftToRight(props) {
    return _jsx(TextDirectionTool, __assign({ direction: "ltr" }, props));
}
