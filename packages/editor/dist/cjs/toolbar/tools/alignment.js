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
exports.AlignJustify = exports.AlignRight = exports.AlignLeft = exports.AlignCenter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
function AlignmentTool(props) {
    const { editor, alignment } = props, toolProps = __rest(props, ["editor", "alignment"]);
    return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolProps, { onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setTextAlign(alignment).run(); }, toggled: editor.isActive({ textAlign: alignment }) })));
}
function AlignCenter(props) {
    return (0, jsx_runtime_1.jsx)(AlignmentTool, Object.assign({ alignment: "center" }, props));
}
exports.AlignCenter = AlignCenter;
function AlignLeft(props) {
    return (0, jsx_runtime_1.jsx)(AlignmentTool, Object.assign({ alignment: "left" }, props));
}
exports.AlignLeft = AlignLeft;
function AlignRight(props) {
    return (0, jsx_runtime_1.jsx)(AlignmentTool, Object.assign({ alignment: "right" }, props));
}
exports.AlignRight = AlignRight;
function AlignJustify(props) {
    return (0, jsx_runtime_1.jsx)(AlignmentTool, Object.assign({ alignment: "justify" }, props));
}
exports.AlignJustify = AlignJustify;
