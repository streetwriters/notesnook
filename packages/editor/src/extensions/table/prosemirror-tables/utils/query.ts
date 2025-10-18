import type { Node, ResolvedPos } from "prosemirror-model";
import type { Selection } from "prosemirror-state";
import { CellSelection } from "../cellselection.js";
import { cellAround, cellNear, inSameTable } from "../util.js";

/**
 * Checks if the given object is a `CellSelection` instance.
 *
 * @internal
 */
function isCellSelection(value: unknown): value is CellSelection {
  return value instanceof CellSelection;
}

/**
 * Find the closest table node for a given position.
 *
 * @public
 */
export function findTable($pos: ResolvedPos): FindNodeResult | null {
  return findParentNode((node) => node.type.spec.tableRole === "table", $pos);
}

/**
 * Try to find the anchor and head cell in the same table by using the given
 * anchor and head as hit points, or fallback to the selection's anchor and
 * head.
 *
 * @public
 */
export function findCellRange(
  selection: Selection,
  anchorHit?: number,
  headHit?: number
): [ResolvedPos, ResolvedPos] | null {
  if (anchorHit == null && headHit == null && isCellSelection(selection)) {
    return [selection.$anchorCell, selection.$headCell];
  }

  const anchor: number = anchorHit ?? headHit ?? selection.anchor;
  const head: number = headHit ?? anchorHit ?? selection.head;

  const doc = selection.$head.doc;

  const $anchorCell = findCellPos(doc, anchor);
  const $headCell = findCellPos(doc, head);

  if ($anchorCell && $headCell && inSameTable($anchorCell, $headCell)) {
    return [$anchorCell, $headCell];
  }
  return null;
}

/**
 * Try to find a resolved pos of a cell by using the given pos as a hit point.
 *
 * @public
 */
export function findCellPos(doc: Node, pos: number): ResolvedPos | undefined {
  const $pos = doc.resolve(pos);
  return cellAround($pos) || cellNear($pos);
}

/**
 * Result of finding a parent node.
 *
 * @public
 */
export interface FindNodeResult {
  /**
   * The closest parent node that satisfies the predicate.
   */
  node: Node;

  /**
   * The position directly before the node.
   */
  pos: number;

  /**
   * The position at the start of the node.
   */
  start: number;

  /**
   * The depth of the node.
   */
  depth: number;
}

/**
 * Find the closest parent node that satisfies the predicate.
 *
 * @internal
 */
function findParentNode(
  /**
   * The predicate to test the parent node.
   */
  predicate: (node: Node) => boolean,
  /**
   * The position to start searching from.
   */
  $pos: ResolvedPos
): FindNodeResult | null {
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);

    if (predicate(node)) {
      const pos = depth === 0 ? 0 : $pos.before(depth);
      const start = $pos.start(depth);
      return { node, pos, start, depth };
    }
  }

  return null;
}
