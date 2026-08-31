// This file defines helpers for normalizing tables, making sure no
// cells overlap (which can happen, if you have the wrong col- and
// rowspans) and that each row has the same width. Uses the problems
// reported by `TableMap`.

import { Node } from "prosemirror-model";
import { EditorState, PluginKey, Transaction } from "prosemirror-state";
import { tableNodeTypes, TableRole } from "./schema.js";
import { TableMap } from "./tablemap.js";
import { CellAttrs, removeColSpan } from "./util.js";
import { profiler } from "../../../utils/profiler.js";
import { changedDescendants } from "../../../utils/prosemirror.js";

/**
 * @public
 */
export const fixTablesKey = new PluginKey<{ fixTables: boolean }>("fix-tables");

/**
 * Inspect all tables in the given state's document and return a
 * transaction that fixes them, if necessary. If `oldState` was
 * provided, that is assumed to hold a previous, known-good state,
 * which will be used to avoid re-scanning unchanged parts of the
 * document.
 *
 * @public
 */
export function fixTables(
  state: EditorState,
  oldState?: EditorState
): Transaction | undefined {
  let tr: Transaction | undefined;
  const check = (node: Node, pos: number, was?: Node) => {
    if (node.type.spec.tableRole != "table") return;
    if (was && wellFormed.get(was) && sameShape(was, node)) {
      wellFormed.set(node, true);
      profiler.count("tables.shapeUnchanged");
      return;
    }
    profiler.count("tables.checked");
    profiler.gauge("tables.rows", node.childCount);
    tr = profiler.time("tables.fixTable", () => fixTable(state, node, pos, tr));
  };
  if (!oldState) state.doc.descendants((node, pos) => check(node, pos));
  else if (oldState.doc != state.doc)
    changedDescendants(oldState.doc, state.doc, 0, check);
  return tr;
}

/**
 * Tables already found to be well formed. Checking one properly means walking
 * every cell, which is far too much to do on every keystroke, so a table that
 * was sound last time and has not changed shape since is taken on trust.
 */
const wellFormed = new WeakMap<Node, boolean>();

/**
 * Whether two versions of a table have the same cells in the same places.
 *
 * What can be wrong with a table -- a cell missing, two cells laid over each
 * other -- follows entirely from that, so a table whose shape has not moved has
 * nothing new to fix. Typing in a cell leaves every row but one untouched, so
 * this is mostly pointer comparisons, where working the answer out from the
 * table itself means walking every cell of it on every keystroke.
 */
function sameShape(before: Node, after: Node): boolean {
  if (before.childCount != after.childCount) return false;
  for (let row = 0; row < after.childCount; row++) {
    const was = before.child(row);
    const now = after.child(row);
    if (was == now) continue;
    if (was.childCount != now.childCount) return false;
    for (let cell = 0; cell < now.childCount; cell++) {
      const before = was.child(cell).attrs;
      const after = now.child(cell).attrs;
      if (before.colspan != after.colspan || before.rowspan != after.rowspan)
        return false;
    }
  }
  return true;
}

// Fix the given table, if necessary. Will append to the transaction
// it was given, if non-null, or create a new one if necessary.
export function fixTable(
  state: EditorState,
  table: Node,
  tablePos: number,
  tr: Transaction | undefined
): Transaction | undefined {
  const map = TableMap.get(table);
  if (!map.problems) {
    wellFormed.set(table, true);
    return tr;
  }
  if (!tr) tr = state.tr;

  // Track which rows we must add cells to, so that we can adjust that
  // when fixing collisions.
  const mustAdd: number[] = [];
  for (let i = 0; i < map.height; i++) mustAdd.push(0);
  for (let i = 0; i < map.problems.length; i++) {
    const prob = map.problems[i];
    if (prob.type == "collision") {
      const cell = table.nodeAt(prob.pos);
      if (!cell) continue;
      const attrs = cell.attrs as CellAttrs;
      for (let j = 0; j < attrs.rowspan; j++) mustAdd[prob.row + j] += prob.n;
      tr.setNodeMarkup(
        tr.mapping.map(tablePos + 1 + prob.pos),
        null,
        removeColSpan(attrs, attrs.colspan - prob.n, prob.n)
      );
    } else if (prob.type == "missing") {
      mustAdd[prob.row] += prob.n;
    } else if (prob.type == "overlong_rowspan") {
      const cell = table.nodeAt(prob.pos);
      if (!cell) continue;
      tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, {
        ...cell.attrs,
        rowspan: cell.attrs.rowspan - prob.n
      });
    } else if (prob.type == "colwidth mismatch") {
      const cell = table.nodeAt(prob.pos);
      if (!cell) continue;
      tr.setNodeMarkup(tr.mapping.map(tablePos + 1 + prob.pos), null, {
        ...cell.attrs,
        colwidth: prob.colwidth
      });
    } else if (prob.type == "zero_sized") {
      const pos = tr.mapping.map(tablePos);
      tr.delete(pos, pos + table.nodeSize);
    }
  }
  let first, last;
  for (let i = 0; i < mustAdd.length; i++)
    if (mustAdd[i]) {
      if (first == null) first = i;
      last = i;
    }
  // Add the necessary cells, using a heuristic for whether to add the
  // cells at the start or end of the rows (if it looks like a 'bite'
  // was taken out of the table, add cells at the start of the row
  // after the bite. Otherwise add them at the end).
  for (let i = 0, pos = tablePos + 1; i < map.height; i++) {
    const row = table.child(i);
    const end = pos + row.nodeSize;
    const add = mustAdd[i];
    if (add > 0) {
      let role: TableRole = "cell";
      if (row.firstChild) {
        role = row.firstChild.type.spec.tableRole;
      }
      const nodes: Node[] = [];
      for (let j = 0; j < add; j++) {
        const node = tableNodeTypes(state.schema)[role].createAndFill();

        if (node) nodes.push(node);
      }
      const side = (i == 0 || first == i - 1) && last == i ? pos + 1 : end - 1;
      tr.insert(tr.mapping.map(side), nodes);
    }
    pos = end;
  }
  return tr.setMeta(fixTablesKey, { fixTables: true });
}
