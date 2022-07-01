"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuButtonToTool = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
function menuButtonToTool(constructItem) {
    return function (props) {
        const item = constructItem(props.editor);
        return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { icon: item.icon || props.icon, toggled: item.isChecked || false, title: item.title, onClick: item.onClick })));
    };
}
exports.menuButtonToTool = menuButtonToTool;
