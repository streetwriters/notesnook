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
import { useRefValue } from "../../hooks/use-ref-value";
function TextDirectionTool(props) {
    const { editor, direction } = props, toolProps = __rest(props, ["editor", "direction"]);
    const directionRef = useRefValue(direction);
    return (_jsx(ToolButton, Object.assign({}, toolProps, { onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextDirection(directionRef.current).run();
        }, toggled: false })));
}
export function TextDirection(props) {
    const { editor } = props;
    const { textDirection } = Object.assign(Object.assign({}, editor.getAttributes("paragraph")), editor.getAttributes("heading"));
    const newTextDirection = textDirection === "ltr" ? "rtl" : "ltr";
    const icon = textDirection === "ltr" ? "ltr" : "rtl";
    return (_jsx(TextDirectionTool, Object.assign({ direction: newTextDirection }, props, { icon: icon })));
}
