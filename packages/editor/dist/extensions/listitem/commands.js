"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBackspacePressed = void 0;
var prosemirror_utils_1 = require("prosemirror-utils");
// WORKAROUND: if we're at the start of a list item, we need to either
// backspace directly to an empty list item above, or outdent this node
function onBackspacePressed(editor, name, type) {
    var selection = editor.state.selection;
    var empty = selection.empty, $from = selection.$from;
    if (!empty ||
        !isInside(name, type, editor.state) ||
        $from.parentOffset !== 0 ||
        !isFirstChildOfParent(editor.state) ||
        !editor.can().liftListItem(type))
        return false;
    var isEmpty = isListItemEmpty(type, editor.state);
    if (isFirstOfType(type, editor.state)) {
        return editor.commands.liftListItem(type);
    }
    else if (isEmpty)
        return editor.commands.deleteNode(type);
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
    var $from = state.selection.$from;
    var node = type || state.schema.nodes[name];
    var paragraph = state.schema.nodes.paragraph;
    return ((0, prosemirror_utils_1.hasParentNodeOfType)(node)(state.selection) &&
        $from.parent.type === paragraph);
}
function isFirstChildOfParent(state) {
    var $from = state.selection.$from;
    return $from.depth > 1
        ? $from.parentOffset === 0 || $from.index($from.depth - 1) === 0
        : true;
}
var isFirstOfType = function (type, state) {
    var block = (0, prosemirror_utils_1.findParentNodeOfType)(type)(state.selection);
    if (!block)
        return false;
    var pos = block.pos;
    var resolved = state.doc.resolve(pos);
    return !resolved.nodeBefore;
};
function isListItemEmpty(type, state) {
    var block = (0, prosemirror_utils_1.findParentNodeOfType)(type)(state.selection);
    if (!block)
        return false;
    var node = block.node;
    return !node.textContent.length;
}
