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
function AlignmentTool(props) {
    const { editor, alignment } = props, toolProps = __rest(props, ["editor", "alignment"]);
    const alignmentRef = useRefValue(alignment);
    return (_jsx(ToolButton, Object.assign({}, toolProps, { onClick: () => {
            var _a;
            (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextAlign(alignmentRef.current).run();
        }, toggled: false })));
}
export function Alignment(props) {
    const { editor } = props;
    const { textAlign } = Object.assign(Object.assign({}, editor.getAttributes("paragraph")), editor.getAttributes("heading"));
    const newAlignment = textAlign === "left"
        ? "center"
        : textAlign === "center"
            ? "right"
            : textAlign === "right"
                ? "justify"
                : textAlign === "justify"
                    ? "left"
                    : "left";
    const icon = textAlign === "center"
        ? "alignCenter"
        : textAlign === "justify"
            ? "alignJustify"
            : textAlign === "right"
                ? "alignRight"
                : "alignLeft";
    return _jsx(AlignmentTool, Object.assign({ alignment: newAlignment }, props, { icon: icon }));
}
