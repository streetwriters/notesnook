import { Command } from "prosemirror-state";
import { EditorState, TextSelection, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

/**
 * A ProseMirror command for determining whether to exit a math block, based on
 * specific conditions.  Normally called when the user has
 *
 * @param outerView The main ProseMirror EditorView containing this math node.
 * @param dir Used to indicate desired cursor position upon closing a math node.
 *     When set to -1, cursor will be placed BEFORE the math node.
 *     When set to +1, cursor will be placed AFTER the math node.
 * @param borderMode An exit condition based on cursor position and direction.
 * @param requireEmptySelection When TRUE, only exit the math node when the
 *    (inner) selection is empty.
 * @returns A new ProseMirror command based on the input configuration.
 */
export function collapseMathNode(
  outerView: EditorView,
  dir: 1 | -1,
  requireOnBorder: boolean,
  requireEmptySelection = true
): Command {
  // create a new ProseMirror command based on the input conditions
  return (
    innerState: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined
  ) => {
    // get selection info
    const outerState: EditorState = outerView.state;
    const { to: outerTo, from: outerFrom } = outerState.selection;
    const { to: innerTo, from: innerFrom } = innerState.selection;

    // only exit math node when selection is empty
    if (requireEmptySelection && innerTo !== innerFrom) {
      return false;
    }
    const currentPos: number = dir > 0 ? innerTo : innerFrom;

    // when requireOnBorder is TRUE, collapse only when cursor
    // is about to leave the bounds of the math node
    if (requireOnBorder) {
      // (subtract two from nodeSize to account for start and end tokens)
      const nodeSize = innerState.doc.nodeSize - 2;

      // early return if exit conditions not met
      if (dir > 0 && currentPos < nodeSize) {
        return false;
      }
      if (dir < 0 && currentPos > 0) {
        return false;
      }
    }

    // all exit conditions met, so close the math node by moving the cursor outside
    if (dispatch) {
      // set outer selection to be outside of the nodeview
      const targetPos: number = dir > 0 ? outerTo : outerFrom;

      outerView.dispatch(
        outerState.tr.setSelection(
          TextSelection.create(outerState.doc, targetPos)
        )
      );

      // must return focus to the outer view, otherwise no cursor will appear
      outerView.focus();
    }

    return true;
  };
}
