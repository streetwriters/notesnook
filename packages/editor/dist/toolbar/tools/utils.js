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
import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
export function menuButtonToTool(constructItem) {
    return function (props) {
        var item = constructItem(props.editor);
        return (_jsx(ToolButton, __assign({}, props, { icon: item.icon || props.icon, toggled: item.isChecked || false, title: item.title, onClick: item.onClick })));
    };
}
