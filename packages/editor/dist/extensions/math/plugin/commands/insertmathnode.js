"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertMathNode = void 0;
var prosemirror_state_1 = require("prosemirror-state");
////////////////////////////////////////////////////////////////////////////////
/**
 * Returns a new command that can be used to inserts a new math node at the
 * user's current document position, provided that the document schema actually
 * allows a math node to be placed there.
 *
 * @param mathNodeType An instance for either your math_inline or math_display
 *     NodeType.  Must belong to the same schema that your EditorState uses!
 * @param initialText (optional) The initial source content for the math editor.
 */
function insertMathNode(mathNodeType, initialText) {
    if (initialText === void 0) { initialText = ""; }
    return function (state, dispatch) {
        var $from = state.selection.$from, index = $from.index();
        if (!$from.parent.canReplaceWith(index, index, mathNodeType)) {
            return false;
        }
        if (dispatch) {
            var mathNode = mathNodeType.create({}, initialText ? state.schema.text(initialText) : null);
            var tr = state.tr.replaceSelectionWith(mathNode);
            tr = tr.setSelection(prosemirror_state_1.NodeSelection.create(tr.doc, $from.pos));
            dispatch(tr);
        }
        return true;
    };
}
exports.insertMathNode = insertMathNode;
