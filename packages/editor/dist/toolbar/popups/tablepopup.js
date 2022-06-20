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
import { Box, Button, Flex, Text } from "rebass";
import { useEffect, useState } from "react";
import { useIsMobile } from "../stores/toolbar-store";
import { InlineInput } from "../../components/inline-input";
var MAX_COLUMNS = 20;
var MAX_ROWS = 20;
var MIN_COLUMNS = 10;
var MIN_ROWS = 6;
export function TablePopup(props) {
    var isMobile = useIsMobile();
    var autoExpand = !isMobile;
    var cellSize = isMobile ? 30 : 15;
    var onInsertTable = props.onInsertTable;
    var _a = __read(useState({
        column: 0,
        row: 0,
    }), 2), cellLocation = _a[0], setCellLocation = _a[1];
    var _b = __read(useState({
        columns: MIN_COLUMNS,
        rows: MIN_ROWS,
    }), 2), tableSize = _b[0], setTableSize = _b[1];
    useEffect(function () {
        if (!autoExpand)
            return;
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
    }, [cellLocation, autoExpand]);
    return (_jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column", alignItems: "center" } }, { children: [_jsx(Box, __assign({ sx: {
                    display: "grid",
                    gridTemplateColumns: "repeat(".concat(tableSize.columns, ", minmax(").concat(cellSize, "px, 1fr))"),
                    gap: "small",
                    bg: "background",
                    width: "100%",
                }, onTouchMove: function (e) {
                    var touch = e.touches.item(0);
                    var element = document.elementFromPoint(touch.pageX, touch.pageY);
                    if (!element)
                        return;
                    var index = element.dataset.index;
                    if (!index)
                        return;
                    setCellLocation(getCellLocation(parseInt(index), tableSize));
                } }, { children: Array(tableSize.columns * tableSize.rows)
                    .fill(0)
                    .map(function (_, index) { return (_jsx(Box, { "data-index": index, height: cellSize || 15, sx: {
                        border: "1px solid var(--disabled)",
                        borderRadius: "small",
                        bg: isCellHighlighted(index, cellLocation, tableSize)
                            ? "disabled"
                            : "transparent",
                    }, onTouchStart: function () {
                        setCellLocation(getCellLocation(index, tableSize));
                    }, onMouseEnter: function () {
                        setCellLocation(getCellLocation(index, tableSize));
                    }, onClick: function () {
                        onInsertTable({
                            columns: cellLocation.column,
                            rows: cellLocation.row,
                        });
                    } })); }) })), _jsxs(Flex, __assign({ sx: {
                    display: ["flex", "none", "none"],
                    my: 1,
                    alignItems: "center",
                    justifyContent: "center",
                } }, { children: [_jsx(InlineInput, { containerProps: { sx: { mr: 1 } }, label: "columns", placeholder: "".concat(cellLocation.column, " columns"), type: "number", value: cellLocation.column, onChange: function (e) {
                            setCellLocation(function (l) { return (__assign(__assign({}, l), { column: e.target.valueAsNumber || 0 })); });
                        } }), _jsx(InlineInput, { label: "rows", placeholder: "".concat(cellLocation.row, " rows"), type: "number", value: cellLocation.row, onChange: function (e) {
                            setCellLocation(function (l) { return (__assign(__assign({}, l), { row: e.target.valueAsNumber || 0 })); });
                        } })] })), _jsxs(Text, __assign({ variant: "body", sx: { mt: 1, display: ["none", "block", "block"] } }, { children: [cellLocation.column, " x ", cellLocation.row] })), _jsx(Button, __assign({ variant: "primary", sx: {
                    display: ["block", "none", "none"],
                    alignSelf: ["stretch", "end", "end"],
                    py: 2,
                }, onClick: function () {
                    return onInsertTable({
                        columns: cellLocation.column,
                        rows: cellLocation.row,
                    });
                }, disabled: !cellLocation.column || !cellLocation.row }, { children: !cellLocation.column || !cellLocation.row
                    ? "Please set a table size"
                    : "Insert a ".concat(cellLocation.column, " x ").concat(cellLocation.row, " table") }))] })));
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
