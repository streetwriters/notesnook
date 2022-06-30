"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mathBackspaceCmd = void 0;
var prosemirror_state_1 = require("prosemirror-state");
var mathBackspaceCmd = function (state, dispatch) {
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
            dispatch(state.tr.setSelection(new prosemirror_state_1.NodeSelection($beforePos)));
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
exports.mathBackspaceCmd = mathBackspaceCmd;
