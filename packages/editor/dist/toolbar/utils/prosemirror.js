import { findParentNode, } from "@tiptap/core";
export function findSelectedDOMNode(editor, types) {
    var _a;
    var $anchor = editor.state.selection.$anchor;
    var selectedNode = editor.state.doc.nodeAt($anchor.pos);
    var pos = types.includes((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) || "")
        ? $anchor.pos
        : (_a = findParentNode(function (node) { return types.includes(node.type.name); })(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.view.nodeDOM(pos) || null;
}
export function findSelectedNode(editor, type) {
    var _a;
    var $anchor = editor.state.selection.$anchor;
    var selectedNode = editor.state.doc.nodeAt($anchor.pos);
    var pos = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) === type
        ? $anchor.pos
        : (_a = findParentNode(function (node) { return node.type.name === type; })(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.state.doc.nodeAt(pos);
}
export function findMark(node, type) {
    var mark = node.marks.find(function (m) { return m.type.name === type; });
    return mark;
}
export function selectionToOffset(selection) {
    var $from = selection.$from, from = selection.from;
    return { node: $from.node(), from: from, to: from + $from.node().nodeSize };
}
