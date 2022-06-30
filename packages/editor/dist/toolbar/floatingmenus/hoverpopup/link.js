"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkHoverPopupHandler = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbargroup_1 = require("../../components/toolbargroup");
function LinkHoverPopup(props) {
    var editor = props.editor, selectedNode = props.selectedNode;
    var node = selectedNode.node;
    if (!node.isText ||
        node.marks.length <= 0 ||
        !node.marks.some(function (mark) { return mark.type.name === "link"; }))
        return null;
    return ((0, jsx_runtime_1.jsx)(toolbargroup_1.ToolbarGroup, { force: true, tools: ["openLink", "editLink", "removeLink"], editor: editor, selectedNode: selectedNode, sx: {
            bg: "background",
            boxShadow: "menu",
            borderRadius: "default",
            p: 1,
        } }));
}
exports.LinkHoverPopupHandler = { a: LinkHoverPopup };
