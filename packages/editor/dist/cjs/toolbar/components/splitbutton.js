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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const rebass_1 = require("rebass");
const icons_1 = require("../icons");
const icon_1 = require("./icon");
const toolbutton_1 = require("./toolbutton");
const toolbarstore_1 = require("../stores/toolbarstore");
const button_1 = require("../../components/button");
const react_2 = __importDefault(require("react"));
function _SplitButton(props) {
    const { children, toggled, onOpen } = props, toolButtonProps = __rest(props, ["children", "toggled", "onOpen"]);
    const ref = (0, react_1.useRef)(null);
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ ref: ref, sx: {
                    borderRadius: "default",
                } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, toolButtonProps, { sx: { mr: 0, ":hover": { bg: "hover" } }, toggled: false })), (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ sx: {
                            flexShrink: 0,
                            p: 0,
                            m: 0,
                            px: "3px",
                            bg: "bgSecondary",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: onOpen }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: toolbarLocation === "bottom" ? icons_1.Icons.chevronUp : icons_1.Icons.chevronDown, color: "text", size: "small", sx: { flexShrink: 0 } }) }))] })), children] }));
}
exports.SplitButton = react_2.default.memo(_SplitButton, (prev, next) => {
    return (prev.toggled === next.toggled &&
        JSON.stringify(prev.sx) === JSON.stringify(next.sx));
});
