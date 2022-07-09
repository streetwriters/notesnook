"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkHoverPopupHandler = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbargroup_1 = require("../../components/toolbargroup");
function LinkHoverPopup(props) {
    const { editor, selectedNode } = props;
    const { node } = selectedNode;
    if (!(node === null || node === void 0 ? void 0 : node.isText) ||
        node.marks.length <= 0 ||
        !node.marks.some((mark) => mark.type.name === "link"))
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { force: true, tools: ["openLink", "editLink", "removeLink"], editor: editor, selectedNode: selectedNode, sx: {
            bg: "background",
            boxShadow: "menu",
            borderRadius: "default",
            p: 1,
        } }));
}
exports.LinkHoverPopupHandler = { a: LinkHoverPopup };
