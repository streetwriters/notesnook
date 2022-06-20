import { jsx as _jsx } from "react/jsx-runtime";
import { ToolbarGroup } from "../components/toolbar-group";
export function ImageToolbar(props) {
    var editor = props.editor;
    return (_jsx(ToolbarGroup, { editor: editor, tools: [
            "imageAlignLeft",
            "imageAlignCenter",
            "imageAlignRight",
            "imageProperties",
        ], sx: {
            boxShadow: "menu",
            borderRadius: "default",
            bg: "background",
        } }));
}
