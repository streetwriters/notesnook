"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nudgeCursorBackCmd = exports.nudgeCursorForwardCmd = exports.nudgeCursorCmd = void 0;
const prosemirror_state_1 = require("prosemirror-state");
////////////////////////////////////////////////////////////////////////////////
/**
 * Some browsers (cough firefox cough) don't properly handle cursor movement on
 * the edges of a NodeView, so we need to make the desired behavior explicit.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1252108
 */
function nudgeCursorCmd(dir) {
    return (innerState, dispatch) => {
        let { to, from } = innerState.selection;
        // compute target position
        let emptySelection = to === from;
        let currentPos = dir < 0 ? from : to;
        let increment = emptySelection ? dir : 0;
        let nodeSize = innerState.doc.nodeSize;
        let targetPos = Math.max(0, Math.min(nodeSize, currentPos + increment));
        if (dispatch) {
            dispatch(innerState.tr.setSelection(prosemirror_state_1.TextSelection.create(innerState.doc, targetPos)));
        }
        return true;
    };
}
exports.nudgeCursorCmd = nudgeCursorCmd;
exports.nudgeCursorForwardCmd = nudgeCursorCmd(+1);
exports.nudgeCursorBackCmd = nudgeCursorCmd(-1);
