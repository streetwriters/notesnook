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
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuButtonToTool = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
function menuButtonToTool(constructItem) {
    return function (props) {
        var item = constructItem(props.editor);
        return ((0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { icon: item.icon || props.icon, toggled: item.isChecked || false, title: item.title, onClick: item.onClick })));
    };
}
exports.menuButtonToTool = menuButtonToTool;
