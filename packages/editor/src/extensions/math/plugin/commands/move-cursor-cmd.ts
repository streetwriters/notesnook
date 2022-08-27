import { Command } from "prosemirror-state";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";

////////////////////////////////////////////////////////////////////////////////

/**
 * Some browsers (cough firefox cough) don't properly handle cursor movement on
 * the edges of a NodeView, so we need to make the desired behavior explicit.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1252108
 */
export function nudgeCursorCmd(dir: -1 | 0 | 1): Command {
  return (
    innerState: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined
  ) => {
    const { to, from } = innerState.selection;

    // compute target position
    const emptySelection: boolean = to === from;
    const currentPos: number = dir < 0 ? from : to;
    const increment: number = emptySelection ? dir : 0;
    const nodeSize: number = innerState.doc.nodeSize;
    const targetPos: number = Math.max(
      0,
      Math.min(nodeSize, currentPos + increment)
    );

    if (dispatch) {
      dispatch(
        innerState.tr.setSelection(
          TextSelection.create(innerState.doc, targetPos)
        )
      );
    }
    return true;
  };
}

export const nudgeCursorForwardCmd: Command = nudgeCursorCmd(+1);
export const nudgeCursorBackCmd: Command = nudgeCursorCmd(-1);
