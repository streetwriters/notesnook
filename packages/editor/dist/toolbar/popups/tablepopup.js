var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { useEffect, useState } from "react";
var MAX_COLUMNS = 20;
var MAX_ROWS = 20;
var MIN_COLUMNS = 12;
var MIN_ROWS = 6;
export function TablePopup(props) {
    var onClose = props.onClose;
    var _a = __read(useState({
        column: 0,
        row: 0,
    }), 2), cellLocation = _a[0], setCellLocation = _a[1];
    var _b = __read(useState({
        columns: MIN_COLUMNS,
        rows: MIN_ROWS,
    }), 2), tableSize = _b[0], setTableSize = _b[1];
    useEffect(function () {
        setTableSize(function (old) {
            var columns = old.columns, rows = old.rows;
            var column = cellLocation.column, row = cellLocation.row;
            var isDecrease = row === rows - 2 || column === columns - 2;
            var rowFactor = Number(row === rows || row === rows - 2);
            var columnFactor = Number(column === columns || column === columns - 2);
            return {
                columns: isDecrease
                    ? Math.max(column + columnFactor, MIN_COLUMNS)
                    : Math.min(old.columns + columnFactor, MAX_COLUMNS),
                rows: isDecrease
                    ? Math.max(row + rowFactor, MIN_ROWS)
                    : Math.min(old.rows + rowFactor, MAX_ROWS),
            };
        });
    }, [cellLocation]);
    return (_jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column", alignItems: "center" } }, { children: [_jsx(Box, __assign({ sx: {
                    display: "grid",
                    gridTemplateColumns: "1fr ".repeat(tableSize.columns),
                    gap: "3px",
                    bg: "background",
                } }, { children: Array(tableSize.columns * tableSize.rows)
                    .fill(0)
                    .map(function (_, index) { return (_jsx(Box, { width: 15, height: 15, sx: {
                        border: "1px solid var(--disabled)",
                        borderRadius: "2px",
                        bg: isCellHighlighted(index, cellLocation, tableSize)
                            ? "disabled"
                            : "transparent",
                        ":hover": {
                            bg: "disabled",
                        },
                    }, onMouseEnter: function () {
                        setCellLocation(getCellLocation(index, tableSize));
                    }, onClick: function () {
                        onClose({
                            columns: cellLocation.column,
                            rows: cellLocation.row,
                        });
                    } })); }) })), _jsxs(Text, __assign({ variant: "body", sx: { mt: 1 } }, { children: [cellLocation.column, "x", cellLocation.row] }))] })));
}
function getCellLocation(index, tableSize) {
    var cellIndex = index + 1;
    var column = cellIndex % tableSize.columns;
    var row = cellIndex / tableSize.columns;
    var flooredRow = Math.floor(row);
    row = row === flooredRow ? row : flooredRow + 1;
    return { column: column ? column : tableSize.columns, row: row };
}
function isCellHighlighted(index, currentCellLocation, tableSize) {
    var cellLocation = getCellLocation(index, tableSize);
    return (cellLocation.row <= currentCellLocation.row &&
        cellLocation.column <= currentCellLocation.column);
}
