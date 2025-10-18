// This file defines a plugin that handles the drawing of cell
// selections and the basic user interactions for creating and working
// with such selections. It also makes sure that, after each
// transaction, the shapes of tables are normalized to be rectangular
// and not contain overlapping cells.

import { Plugin } from "prosemirror-state";

import { drawCellSelection, normalizeSelection } from "./cellselection.js";
import { fixTables, fixTablesKey } from "./fixtables.js";
import {
  handleKeyDown,
  handleMouseDown,
  handlePaste,
  handleTripleClick
} from "./input.js";
import { tableEditingKey } from "./util.js";

/**
 * @public
 */
export type TableEditingOptions = {
  /**
   * Whether to allow table node selection.
   *
   * By default, any node selection wrapping a table will be converted into a
   * CellSelection wrapping all cells in the table. You can pass `true` to allow
   * the selection to remain a NodeSelection.
   *
   * @default false
   */
  allowTableNodeSelection?: boolean;
};

/**
 * Creates a [plugin](http://prosemirror.net/docs/ref/#state.Plugin)
 * that, when added to an editor, enables cell-selection, handles
 * cell-based copy/paste, and makes sure tables stay well-formed (each
 * row has the same width, and cells don't overlap).
 *
 * You should probably put this plugin near the end of your array of
 * plugins, since it handles mouse and arrow key events in tables
 * rather broadly, and other plugins, like the gap cursor or the
 * column-width dragging plugin, might want to get a turn first to
 * perform more specific behavior.
 *
 * @public
 */
export function tableEditing({
  allowTableNodeSelection = false
}: TableEditingOptions = {}): Plugin {
  return new Plugin({
    key: tableEditingKey,

    // This piece of state is used to remember when a mouse-drag
    // cell-selection is happening, so that it can continue even as
    // transactions (which might move its anchor cell) come in.
    state: {
      init() {
        return null;
      },
      apply(tr, cur) {
        const set = tr.getMeta(tableEditingKey);
        if (set != null) return set == -1 ? null : set;
        if (cur == null || !tr.docChanged) return cur;
        const { deleted, pos } = tr.mapping.mapResult(cur);
        return deleted ? null : pos;
      }
    },

    props: {
      decorations: drawCellSelection,

      handleDOMEvents: {
        mousedown: handleMouseDown,
        touchstart: handleMouseDown
      },

      createSelectionBetween(view) {
        return tableEditingKey.getState(view.state) != null
          ? view.state.selection
          : null;
      },

      handleTripleClick,

      handleKeyDown,

      handlePaste
    },

    appendTransaction(transactions, oldState, state) {
      return normalizeSelection(
        state,
        fixTables(state, oldState),
        oldState,
        allowTableNodeSelection
      );
    }
  });
}
