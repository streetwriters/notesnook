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
exports.LeftToRight = exports.RightToLeft = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
function TextDirectionTool(props) {
    const { editor, direction } = props, toolProps = __rest(props, ["editor", "direction"]);
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextDirection(direction).run(); }, toggled: editor.isActive({ textDirection: direction }) })));
}
function RightToLeft(props) {
    return (0, jsx_runtime_1.jsx)(TextDirectionTool, Object.assign({ direction: "rtl" }, props));
}
exports.RightToLeft = RightToLeft;
function LeftToRight(props) {
    return (0, jsx_runtime_1.jsx)(TextDirectionTool, Object.assign({ direction: "ltr" }, props));
}
exports.LeftToRight = LeftToRight;
