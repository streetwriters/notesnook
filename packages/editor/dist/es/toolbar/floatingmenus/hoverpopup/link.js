import { jsx as _jsx } from "react/jsx-runtime";
import { ToolbarGroup } from "../../components/toolbar-group";
function LinkHoverPopup(props) {
    const { editor, selectedNode } = props;
    const { node } = selectedNode;
    if (!node.isText ||
        node.marks.length <= 0 ||
        !node.marks.some((mark) => mark.type.name === "link"))
        return null;
    return (_jsx(ToolbarGroup, { force: true, tools: ["openLink", "editLink", "removeLink"], editor: editor, selectedNode: selectedNode, sx: {
            bg: "background",
            boxShadow: "menu",
            borderRadius: "default",
            p: 1,
        } }));
}
export const LinkHoverPopupHandler = { a: LinkHoverPopup };
