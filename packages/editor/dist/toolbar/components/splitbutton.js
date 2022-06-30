"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitButton = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var rebass_1 = require("rebass");
var icons_1 = require("../icons");
var icon_1 = require("./icon");
var toolbutton_1 = require("./toolbutton");
var toolbarstore_1 = require("../stores/toolbarstore");
var button_1 = require("../../components/button");
var react_2 = __importDefault(require("react"));
function _SplitButton(props) {
    var children = props.children, toggled = props.toggled, onOpen = props.onOpen, toolButtonProps = __rest(props, ["children", "toggled", "onOpen"]);
    var ref = (0, react_1.useRef)(null);
    var toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ ref: ref, sx: {
                    borderRadius: "default",
                    bg: toggled ? "hover" : "transparent",
                    ":hover": { bg: "hover" },
                } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, toolButtonProps, { toggled: toggled })), (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ sx: {
                            p: 0,
                            m: 0,
                            bg: toggled ? "hover" : "transparent",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: onOpen }, { children: (0, jsx_runtime_1.jsx)(icon_1.Icon, { path: toolbarLocation === "bottom" ? icons_1.Icons.chevronUp : icons_1.Icons.chevronDown, color: "text", size: "small" }) }))] })), children] }));
}
exports.SplitButton = react_2.default.memo(_SplitButton, function (prev, next) {
    return prev.toggled === next.toggled;
});
