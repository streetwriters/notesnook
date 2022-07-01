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
    const { editor, direction } = props, toolProps = __rest(props, ["editor", "direction"]);
    return (_jsx(ToolButton, Object.assign({}, toolProps, { onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextDirection(direction).run(); }, toggled: editor.isActive({ textDirection: direction }) })));
}
export function RightToLeft(props) {
    return _jsx(TextDirectionTool, Object.assign({ direction: "rtl" }, props));
}
export function LeftToRight(props) {
    return _jsx(TextDirectionTool, Object.assign({ direction: "ltr" }, props));
}
