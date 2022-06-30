"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nudgeCursorBackCmd = exports.nudgeCursorForwardCmd = exports.nudgeCursorCmd = void 0;
var prosemirror_state_1 = require("prosemirror-state");
////////////////////////////////////////////////////////////////////////////////
/**
 * Some browsers (cough firefox cough) don't properly handle cursor movement on
 * the edges of a NodeView, so we need to make the desired behavior explicit.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1252108
 */
function nudgeCursorCmd(dir) {
    return function (innerState, dispatch) {
        var _a = innerState.selection, to = _a.to, from = _a.from;
        // compute target position
        var emptySelection = to === from;
        var currentPos = dir < 0 ? from : to;
        var increment = emptySelection ? dir : 0;
        var nodeSize = innerState.doc.nodeSize;
        var targetPos = Math.max(0, Math.min(nodeSize, currentPos + increment));
        if (dispatch) {
            dispatch(innerState.tr.setSelection(prosemirror_state_1.TextSelection.create(innerState.doc, targetPos)));
        }
        return true;
    };
}
exports.nudgeCursorCmd = nudgeCursorCmd;
exports.nudgeCursorForwardCmd = nudgeCursorCmd(+1);
exports.nudgeCursorBackCmd = nudgeCursorCmd(-1);
