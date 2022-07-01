import { jsx as _jsx } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
export function menuButtonToTool(constructItem) {
    return function (props) {
        const item = constructItem(props.editor);
        return (_jsx(ToolButton, Object.assign({}, props, { icon: item.icon || props.icon, toggled: item.isChecked || false, title: item.title, onClick: item.onClick })));
    };
}
