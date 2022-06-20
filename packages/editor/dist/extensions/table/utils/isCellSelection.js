import { CellSelection } from 'prosemirror-tables';
export function isCellSelection(value) {
    return value instanceof CellSelection;
}
