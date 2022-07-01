import { NodeSelection } from "prosemirror-state";
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
export function insertMathNode(mathNodeType, initialText = "") {
    return function (state, dispatch) {
        let { $from } = state.selection, index = $from.index();
        if (!$from.parent.canReplaceWith(index, index, mathNodeType)) {
            return false;
        }
        if (dispatch) {
            let mathNode = mathNodeType.create({}, initialText ? state.schema.text(initialText) : null);
            let tr = state.tr.replaceSelectionWith(mathNode);
            tr = tr.setSelection(NodeSelection.create(tr.doc, $from.pos));
            dispatch(tr);
        }
        return true;
    };
}
