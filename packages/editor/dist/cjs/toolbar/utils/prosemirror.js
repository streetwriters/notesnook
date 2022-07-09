"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isListActive = exports.findListItemType = exports.selectionToOffset = exports.findMark = exports.findSelectedNode = exports.findSelectedDOMNode = void 0;
const core_1 = require("@tiptap/core");
function findSelectedDOMNode(editor, types) {
    var _a;
    const { $anchor } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt($anchor.pos);
    const pos = types.includes((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) || "")
        ? $anchor.pos
        : (_a = (0, core_1.findParentNode)((node) => types.includes(node.type.name))(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.view.nodeDOM(pos) || null;
}
exports.findSelectedDOMNode = findSelectedDOMNode;
function findSelectedNode(editor, type) {
    var _a;
    const { $anchor } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt($anchor.pos);
    const pos = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) === type
        ? $anchor.pos
        : (_a = (0, core_1.findParentNode)((node) => node.type.name === type)(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.state.doc.nodeAt(pos);
}
exports.findSelectedNode = findSelectedNode;
function findMark(node, type) {
    const mark = node.marks.find((m) => m.type.name === type);
    return mark;
}
exports.findMark = findMark;
function selectionToOffset(state) {
    const { $from, from } = state.selection;
    return {
        node: state.doc.nodeAt(from) || undefined,
        from,
        to: from + $from.node().nodeSize,
    };
}
exports.selectionToOffset = selectionToOffset;
function findListItemType(editor) {
    const isTaskList = editor.isActive("taskList");
    const isOutlineList = editor.isActive("outlineList");
    const isList = editor.isActive("bulletList") || editor.isActive("orderedList");
    return isList
        ? "listItem"
        : isOutlineList
            ? "outlineListItem"
            : isTaskList
                ? "taskItem"
                : null;
}
exports.findListItemType = findListItemType;
function isListActive(editor) {
    const isTaskList = editor.isActive("taskList");
    const isOutlineList = editor.isActive("outlineList");
    const isList = editor.isActive("bulletList") || editor.isActive("orderedList");
    return isTaskList || isOutlineList || isList;
}
exports.isListActive = isListActive;
