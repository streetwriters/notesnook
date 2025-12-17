import { CellSelection } from "../prosemirror-tables/cellselection.js";

export function isCellSelection(value: unknown): value is CellSelection {
  return value instanceof CellSelection;
}
