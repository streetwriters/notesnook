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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Counter = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("react"));
var rebass_1 = require("rebass");
var button_1 = require("../../components/button");
var toolbutton_1 = require("./toolbutton");
function _Counter(props) {
    var title = props.title, onDecrease = props.onDecrease, onIncrease = props.onIncrease, onReset = props.onReset, value = props.value;
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
            alignItems: "center",
            mr: 1,
            ":last-of-type": {
                mr: 0,
            },
        } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Decrease ".concat(title), icon: "minus", variant: "small", onClick: onDecrease }), (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ sx: {
                    color: "text",
                    bg: "transparent",
                    px: 0,
                    fontSize: "subBody",
                    mx: 1,
                    textAlign: "center",
                }, onClick: onReset, title: "Reset ".concat(title) }, { children: value })), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Increase ".concat(title), icon: "plus", variant: "small", onClick: onIncrease })] })));
}
exports.Counter = react_1.default.memo(_Counter, function (prev, next) {
    return prev.value === next.value;
});
