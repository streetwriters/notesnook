import { findParentNode } from "@tiptap/core";
export function findSelectedDOMNode(editor, types) {
    var _a;
    const { $anchor } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt($anchor.pos);
    const pos = types.includes((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) || "")
        ? $anchor.pos
        : (_a = findParentNode((node) => types.includes(node.type.name))(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.view.nodeDOM(pos) || null;
}
export function findSelectedNode(editor, type) {
    var _a;
    const { $anchor } = editor.state.selection;
    const selectedNode = editor.state.doc.nodeAt($anchor.pos);
    const pos = (selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.type.name) === type
        ? $anchor.pos
        : (_a = findParentNode((node) => node.type.name === type)(editor.state.selection)) === null || _a === void 0 ? void 0 : _a.pos;
    if (!pos)
        return null;
    return editor.state.doc.nodeAt(pos);
}
export function findMark(node, type) {
    const mark = node.marks.find((m) => m.type.name === type);
    return mark;
}
export function selectionToOffset(selection) {
    const { $from, from } = selection;
    return { node: $from.node(), from, to: from + $from.node().nodeSize };
}
export function findListItemType(editor) {
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
export function isListActive(editor) {
    const isTaskList = editor.isActive("taskList");
    const isOutlineList = editor.isActive("outlineList");
    const isList = editor.isActive("bulletList") || editor.isActive("orderedList");
    return isTaskList || isOutlineList || isList;
}
