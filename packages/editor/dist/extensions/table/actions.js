"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveRowUp = exports.moveRowDown = exports.moveColumnRight = exports.moveColumnLeft = void 0;
var prosemirror_tables_1 = require("@_ueberdosis/prosemirror-tables");
function moveColumnRight(editor) {
    var tr = editor.state.tr;
    var rect = (0, prosemirror_tables_1.selectedRect)(editor.state);
    if (rect.right === rect.map.width)
        return;
    var transaction = moveColumn(tr, rect, rect.left, rect.left + 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
exports.moveColumnRight = moveColumnRight;
function moveColumnLeft(editor) {
    var tr = editor.state.tr;
    var rect = (0, prosemirror_tables_1.selectedRect)(editor.state);
    if (rect.left === 0)
        return;
    var transaction = moveColumn(tr, rect, rect.left, rect.left - 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
exports.moveColumnLeft = moveColumnLeft;
function moveRowDown(editor) {
    var tr = editor.state.tr;
    var rect = (0, prosemirror_tables_1.selectedRect)(editor.state);
    if (rect.top + 1 === rect.map.height)
        return;
    var transaction = moveRow(tr, rect, rect.top, rect.top + 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
exports.moveRowDown = moveRowDown;
function moveRowUp(editor) {
    var tr = editor.state.tr;
    var rect = (0, prosemirror_tables_1.selectedRect)(editor.state);
    if (rect.top === 0)
        return;
    var transaction = moveRow(tr, rect, rect.top, rect.top - 1);
    if (!transaction)
        return;
    editor.view.dispatch(transaction);
}
exports.moveRowUp = moveRowUp;
function moveColumn(tr, rect, from, to) {
    var fromCells = getColumnCells(rect, from);
    var toCells = getColumnCells(rect, to);
    return moveCells(tr, rect, fromCells, toCells);
}
function getColumnCells(_a, col) {
    var map = _a.map, table = _a.table;
    var cells = [];
    for (var row = 0; row < map.height;) {
        var index = row * map.width + col;
        if (index >= map.map.length)
            break;
        var pos = map.map[index];
        var cell = table.nodeAt(pos);
        if (!cell)
            continue;
        cells.push({ cell: cell, pos: pos });
        row += cell.attrs.rowspan;
    }
    return cells;
}
function moveRow(tr, rect, from, to) {
    var fromCells = getRowCells(rect, from);
    var toCells = getRowCells(rect, to);
    return moveCells(tr, rect, fromCells, toCells);
}
function getRowCells(_a, row) {
    var map = _a.map, table = _a.table;
    var cells = [];
    for (var col = 0, index = row * map.width; col < map.width; col++, index++) {
        if (index >= map.map.length)
            break;
        var pos = map.map[index];
        var cell = table.nodeAt(pos);
        if (!cell)
            continue;
        cells.push({ cell: cell, pos: pos });
        col += cell.attrs.colspan - 1;
    }
    return cells;
}
function moveCells(tr, rect, fromCells, toCells) {
    if (fromCells.length !== toCells.length)
        return;
    var mapStart = tr.mapping.maps.length;
    for (var i = 0; i < toCells.length; ++i) {
        var fromCell = fromCells[i];
        var toCell = toCells[i];
        var fromStart = tr.mapping
            .slice(mapStart)
            .map(rect.tableStart + fromCell.pos);
        var fromEnd = fromStart + fromCell.cell.nodeSize;
        var fromSlice = tr.doc.slice(fromStart, fromEnd);
        var toStart = tr.mapping
            .slice(mapStart)
            .map(rect.tableStart + toCell.pos);
        var toEnd = toStart + toCell.cell.nodeSize;
        var toSlice = tr.doc.slice(toStart, toEnd);
        tr.replace(toStart, toEnd, fromSlice);
        fromStart = tr.mapping.slice(mapStart).map(rect.tableStart + fromCell.pos);
        fromEnd = fromStart + fromCell.cell.nodeSize;
        tr.replace(fromStart, fromEnd, toSlice);
    }
    return tr;
}
