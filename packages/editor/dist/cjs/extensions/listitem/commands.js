"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBackspacePressed = void 0;
const prosemirror_utils_1 = require("prosemirror-utils");
// WORKAROUND: if we're at the start of a list item, we need to either
// backspace directly to an empty list item above, or outdent this node
function onBackspacePressed(editor, name, type) {
    const { selection } = editor.state;
    const { empty, $from } = selection;
    if (!empty ||
        !isInside(name, type, editor.state) ||
        $from.parentOffset !== 0 ||
        !isFirstChildOfParent(editor.state) ||
        !editor.can().liftListItem(type))
        return false;
    const isEmpty = isListItemEmpty(type, editor.state);
    if (isEmpty) {
        if (isFirstOfType(type, editor.state)) {
            const parentList = getListFromListItem(type, editor.state);
            if (!parentList)
                return false;
            return editor.commands.deleteNode(parentList.type);
        }
        return editor.commands.deleteNode(type);
    }
    else if (isFirstOfType(type, editor.state)) {
        return editor.commands.liftListItem(type);
    }
    else {
        // we have to run join backward twice because on the first join
        // the two list items are joined i.e., the editor just puts their
        // paragraphs next to each other. The next join merges the paragraphs
        // like it should be.
        return editor.chain().joinBackward().joinBackward().run();
    }
}
exports.onBackspacePressed = onBackspacePressed;
function isInside(name, type, state) {
    const { $from } = state.selection;
    let node = type || state.schema.nodes[name];
    const { paragraph } = state.schema.nodes;
    return ((0, prosemirror_utils_1.hasParentNodeOfType)(node)(state.selection) &&
        $from.parent.type === paragraph);
}
function isFirstChildOfParent(state) {
    const { $from } = state.selection;
    return $from.depth > 1
        ? $from.parentOffset === 0 || $from.index($from.depth - 1) === 0
        : true;
}
const isFirstOfType = (type, state) => {
    const block = (0, prosemirror_utils_1.findParentNodeOfType)(type)(state.selection);
    if (!block)
        return false;
    const { pos } = block;
    const resolved = state.doc.resolve(pos);
    console.log("isFirstOfType", resolved);
    return !resolved.nodeBefore;
};
const getListFromListItem = (type, state) => {
    var _a;
    const block = (0, prosemirror_utils_1.findParentNodeOfType)(type)(state.selection);
    if (!block)
        return undefined;
    const { pos } = block;
    const resolved = state.doc.resolve(pos);
    if (!resolved.parent.type.spec.group ||
        ((_a = resolved.parent.type.spec.group) === null || _a === void 0 ? void 0 : _a.indexOf("list")) <= -1)
        return undefined;
    return resolved.parent;
};
function isListItemEmpty(type, state) {
    const block = (0, prosemirror_utils_1.findParentNodeOfType)(type)(state.selection);
    if (!block)
        return false;
    const { node } = block;
    return !node.textContent.length;
}
