import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Flex, Text } from "rebass";
import { useEffect, useState } from "react";
import { Popup } from "../components/popup";
import { useIsMobile } from "../stores/toolbar-store";
import { InlineInput } from "../../components/inline-input";
const MAX_COLUMNS = 20;
const MAX_ROWS = 20;
const MIN_COLUMNS = 10;
const MIN_ROWS = 6;
export function TablePopup(props) {
    const isMobile = useIsMobile();
    const autoExpand = !isMobile;
    const cellSize = isMobile ? 30 : 15;
    const { onInsertTable } = props;
    const [cellLocation, setCellLocation] = useState({
        column: 0,
        row: 0,
    });
    const [tableSize, setTableSize] = useState({
        columns: MIN_COLUMNS,
        rows: MIN_ROWS,
    });
    useEffect(() => {
        if (!autoExpand)
            return;
        setTableSize((old) => {
            const { columns, rows } = old;
            const { column, row } = cellLocation;
            let isDecrease = row === rows - 2 || column === columns - 2;
            let rowFactor = Number(row === rows || row === rows - 2);
            let columnFactor = Number(column === columns || column === columns - 2);
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
    return (_jsx(Popup, Object.assign({ action: {
            title: !cellLocation.column || !cellLocation.row
                ? "Please set a table size"
                : `Insert a ${cellLocation.column} x ${cellLocation.row} table`,
            disabled: !cellLocation.column || !cellLocation.row,
            onClick: () => onInsertTable({
                columns: cellLocation.column,
                rows: cellLocation.row,
            }),
        } }, { children: _jsxs(Flex, Object.assign({ sx: { px: 1, pt: 1, flexDirection: "column", alignItems: "center" } }, { children: [_jsx(Box, Object.assign({ sx: {
                        display: "grid",
                        gridTemplateColumns: `repeat(${tableSize.columns}, minmax(${cellSize}px, 1fr))`,
                        gap: "small",
                        bg: "background",
                        width: "100%",
                    }, onTouchMove: (e) => {
                        const touch = e.touches.item(0);
                        const element = document.elementFromPoint(touch.pageX, touch.pageY);
                        if (!element)
                            return;
                        const index = element.dataset.index;
                        if (!index)
                            return;
                        setCellLocation(getCellLocation(parseInt(index), tableSize));
                    } }, { children: Array(tableSize.columns * tableSize.rows)
                        .fill(0)
                        .map((_, index) => (_jsx(Box, { "data-index": index, height: cellSize || 15, sx: {
                            border: "1px solid var(--disabled)",
                            borderRadius: "small",
                            bg: isCellHighlighted(index, cellLocation, tableSize)
                                ? "disabled"
                                : "transparent",
                        }, onTouchStart: () => {
                            setCellLocation(getCellLocation(index, tableSize));
                        }, onMouseEnter: () => {
                            setCellLocation(getCellLocation(index, tableSize));
                        }, onClick: () => {
                            onInsertTable({
                                columns: cellLocation.column,
                                rows: cellLocation.row,
                            });
                        } }, index))) })), _jsxs(Flex, Object.assign({ sx: {
                        display: ["flex", "none", "none"],
                        mt: 1,
                        alignItems: "center",
                        justifyContent: "center",
                    } }, { children: [_jsx(InlineInput, { containerProps: { sx: { mr: 1 } }, label: "columns", placeholder: `${cellLocation.column} columns`, type: "number", value: cellLocation.column, onChange: (e) => {
                                setCellLocation((l) => (Object.assign(Object.assign({}, l), { column: e.target.valueAsNumber || 0 })));
                            } }), _jsx(InlineInput, { label: "rows", placeholder: `${cellLocation.row} rows`, type: "number", value: cellLocation.row, onChange: (e) => {
                                setCellLocation((l) => (Object.assign(Object.assign({}, l), { row: e.target.valueAsNumber || 0 })));
                            } })] })), _jsxs(Text, Object.assign({ variant: "body", sx: { mt: 1, display: ["none", "block", "block"] } }, { children: [cellLocation.column, " x ", cellLocation.row] }))] })) })));
}
function getCellLocation(index, tableSize) {
    const cellIndex = index + 1;
    const column = cellIndex % tableSize.columns;
    let row = cellIndex / tableSize.columns;
    const flooredRow = Math.floor(row);
    row = row === flooredRow ? row : flooredRow + 1;
    return { column: column ? column : tableSize.columns, row };
}
function isCellHighlighted(index, currentCellLocation, tableSize) {
    const cellLocation = getCellLocation(index, tableSize);
    return (cellLocation.row <= currentCellLocation.row &&
        cellLocation.column <= currentCellLocation.column);
}
