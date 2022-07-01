"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Counter = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const rebass_1 = require("rebass");
const button_1 = require("../../components/button");
const toolbutton_1 = require("./toolbutton");
function _Counter(props) {
    const { title, onDecrease, onIncrease, onReset, value } = props;
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
            alignItems: "center",
            mr: 1,
            ":last-of-type": {
                mr: 0,
            },
        } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: `Decrease ${title}`, icon: "minus", variant: "small", onClick: onDecrease }), (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ sx: {
                    color: "text",
                    bg: "transparent",
                    px: 0,
                    fontSize: "subBody",
                    mx: 1,
                    textAlign: "center",
                }, onClick: onReset, title: `Reset ${title}` }, { children: value })), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: `Increase ${title}`, icon: "plus", variant: "small", onClick: onIncrease })] })));
}
exports.Counter = react_1.default.memo(_Counter, (prev, next) => {
    return prev.value === next.value;
});
