import { NodeSelection } from "prosemirror-state";
import { Command as ProseCommand } from "prosemirror-state";

export const mathBackspaceCmd: ProseCommand = (state, dispatch) => {
  // check node before
  const { $from } = state.selection;
  const nodeBefore = $from.nodeBefore;
  if (!nodeBefore) {
    return false;
  }

  if (nodeBefore.type.name == "math_inline") {
    // select math node
    const index = $from.index($from.depth);
    const $beforePos = state.doc.resolve($from.posAtIndex(index - 1));
    if (dispatch) {
      dispatch(state.tr.setSelection(new NodeSelection($beforePos)));
    }
    return true;
  } else if (nodeBefore.type.name == "math_block") {
    /** @todo (8/1/20) implement backspace for math blocks
     * check how code blocks behave when pressing backspace
     */
    return false;
  }

  return false;
};
