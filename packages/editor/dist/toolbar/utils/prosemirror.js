"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectionToOffset = exports.findMark = exports.findSelectedNode = exports.findSelectedDOMNode = void 0;
var core_1 = require("@tiptap/core");
function findSelectedDOMNode(editor, types) {
    var _a;
    var $anchor = editor.state.selection.$anchor;
    var selectedNode = editor.state.doc.nodeAt($anchor.pos);
    var pos = types.includes((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) || "")
        ? $anchor.pos
        : (_a = (0, core_1.findParentNode)(function (node) { return types.includes(node.type.name); })(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.view.nodeDOM(pos) || null;
}
exports.findSelectedDOMNode = findSelectedDOMNode;
function findSelectedNode(editor, type) {
    var _a;
    var $anchor = editor.state.selection.$anchor;
    var selectedNode = editor.state.doc.nodeAt($anchor.pos);
    var pos = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) === type
        ? $anchor.pos
        : (_a = (0, core_1.findParentNode)(function (node) { return node.type.name === type; })(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.state.doc.nodeAt(pos);
}
exports.findSelectedNode = findSelectedNode;
function findMark(node, type) {
    var mark = node.marks.find(function (m) { return m.type.name === type; });
    return mark;
}
exports.findMark = findMark;
function selectionToOffset(selection) {
    var $from = selection.$from, from = selection.from;
    return { node: $from.node(), from: from, to: from + $from.node().nodeSize };
}
exports.selectionToOffset = selectionToOffset;
