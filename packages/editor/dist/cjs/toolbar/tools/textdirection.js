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
exports.TextDirection = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const useRefValue_1 = require("../../hooks/useRefValue");
function TextDirectionTool(props) {
    const { editor, direction } = props, toolProps = __rest(props, ["editor", "direction"]);
    const directionRef = (0, useRefValue_1.useRefValue)(direction);
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextDirection(directionRef.current).run();
        }, toggled: false })));
}
function TextDirection(props) {
    const { editor } = props;
    const { textDirection } = Object.assign(Object.assign({}, editor.getAttributes("paragraph")), editor.getAttributes("heading"));
    const newTextDirection = textDirection === "ltr" ? "rtl" : "ltr";
    const icon = textDirection === "ltr" ? "ltr" : "rtl";
    return ((0, jsx_runtime_1.jsx)(TextDirectionTool, Object.assign({ direction: newTextDirection }, props, { icon: icon })));
}
exports.TextDirection = TextDirection;
