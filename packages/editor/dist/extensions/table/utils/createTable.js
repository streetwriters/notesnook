import { createCell } from "./createCell";
import { getTableNodeTypes } from "./getTableNodeTypes";
export function createTable(schema, rowsCount, colsCount, withHeaderRow, cellContent) {
    var types = getTableNodeTypes(schema);
    var headerCells = [];
    var cells = [];
    for (var index = 0; index < colsCount; index += 1) {
        var cell = createCell(types.cell, cellContent);
        if (cell) {
            cells.push(cell);
        }
        if (withHeaderRow) {
            var headerCell = createCell(types.header_cell, cellContent);
            if (headerCell) {
                headerCells.push(headerCell);
            }
        }
    }
    var rows = [];
    for (var index = 0; index < rowsCount; index += 1) {
        rows.push(types.row.createChecked(null, withHeaderRow && index === 0 ? headerCells : cells));
    }
    return types.table.createChecked(null, rows);
}
