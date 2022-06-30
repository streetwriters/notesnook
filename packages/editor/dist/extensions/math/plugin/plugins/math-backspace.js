import { NodeSelection } from "prosemirror-state";
export var mathBackspaceCmd = function (state, dispatch) {
    // check node before
    var $from = state.selection.$from;
    var nodeBefore = $from.nodeBefore;
    if (!nodeBefore) {
        return false;
    }
    if (nodeBefore.type.name == "math_inline") {
        // select math node
        var index = $from.index($from.depth);
        var $beforePos = state.doc.resolve($from.posAtIndex(index - 1));
        if (dispatch) {
            dispatch(state.tr.setSelection(new NodeSelection($beforePos)));
        }
        return true;
    }
    else if (nodeBefore.type.name == "math_block") {
        /** @todo (8/1/20) implement backspace for math blocks
         * check how code blocks behave when pressing backspace
         */
        return false;
    }
    return false;
};
