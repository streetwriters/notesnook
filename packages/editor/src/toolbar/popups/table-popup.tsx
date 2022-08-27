import { Box, Flex, Text } from "rebass";
import { useEffect, useState } from "react";
import { Popup } from "../components/popup";
import { useIsMobile } from "../stores/toolbar-store";
import { InlineInput } from "../../components/inline-input";

const MAX_COLUMNS = 20;
const MAX_ROWS = 20;
const MIN_COLUMNS = 10;
const MIN_ROWS = 6;

type CellLocation = { column: number; row: number };
type TableSize = { columns: number; rows: number };

export type TablePopupProps = {
  onInsertTable: (size: TableSize) => void;
};
export function TablePopup(props: TablePopupProps) {
  const isMobile = useIsMobile();
  const autoExpand = !isMobile;
  const cellSize = isMobile ? 30 : 15;

  const { onInsertTable } = props;
  const [cellLocation, setCellLocation] = useState<CellLocation>({
    column: 0,
    row: 0
  });
  const [tableSize, setTableSize] = useState<TableSize>({
    columns: MIN_COLUMNS,
    rows: MIN_ROWS
  });

  useEffect(() => {
    if (!autoExpand) return;
    setTableSize((old) => {
      const { columns, rows } = old;
      const { column, row } = cellLocation;

      const isDecrease = row === rows - 2 || column === columns - 2;

      const rowFactor = Number(row === rows || row === rows - 2);
      const columnFactor = Number(column === columns || column === columns - 2);

      return {
        columns: isDecrease
          ? Math.max(column + columnFactor, MIN_COLUMNS)
          : Math.min(old.columns + columnFactor, MAX_COLUMNS),
        rows: isDecrease
          ? Math.max(row + rowFactor, MIN_ROWS)
          : Math.min(old.rows + rowFactor, MAX_ROWS)
      };
    });
  }, [cellLocation, autoExpand]);

  return (
    <Popup
      action={{
        title:
          !cellLocation.column || !cellLocation.row
            ? "Please set a table size"
            : `Insert a ${cellLocation.column} x ${cellLocation.row} table`,
        disabled: !cellLocation.column || !cellLocation.row,
        onClick: () =>
          onInsertTable({
            columns: cellLocation.column,
            rows: cellLocation.row
          })
      }}
    >
      <Flex
        sx={{ px: 1, pt: 1, flexDirection: "column", alignItems: "center" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${tableSize.columns}, minmax(${cellSize}px, 1fr))`, // "1fr ".repeat(tableSize.columns),
            gap: "small",
            bg: "background",
            width: "100%"
          }}
          onTouchMove={(e) => {
            const touch = e.touches.item(0);
            const element = document.elementFromPoint(
              touch.pageX,
              touch.pageY
            ) as HTMLElement;
            if (!element) return;
            const index = element.dataset.index;
            if (!index) return;
            setCellLocation(getCellLocation(parseInt(index), tableSize));
          }}
        >
          {Array(tableSize.columns * tableSize.rows)
            .fill(0)
            .map((_, index) => (
              <Box
                key={index}
                data-index={index}
                height={cellSize || 15}
                sx={{
                  border: "1px solid var(--disabled)",
                  borderRadius: "small",
                  bg: isCellHighlighted(index, cellLocation, tableSize)
                    ? "disabled"
                    : "transparent"
                }}
                onTouchStart={() => {
                  setCellLocation(getCellLocation(index, tableSize));
                }}
                onMouseEnter={() => {
                  setCellLocation(getCellLocation(index, tableSize));
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  onInsertTable({
                    columns: cellLocation.column,
                    rows: cellLocation.row
                  });
                }}
              />
            ))}
        </Box>
        <Flex
          sx={{
            display: ["flex", "none", "none"],
            mt: 1,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <InlineInput
            containerProps={{ sx: { mr: 1 } }}
            label="columns"
            placeholder={`${cellLocation.column} columns`}
            type="number"
            value={cellLocation.column}
            onChange={(e) => {
              setCellLocation((l) => ({
                ...l,
                column: e.target.valueAsNumber || 0
              }));
            }}
          />
          <InlineInput
            label="rows"
            placeholder={`${cellLocation.row} rows`}
            type="number"
            value={cellLocation.row}
            onChange={(e) => {
              setCellLocation((l) => ({
                ...l,
                row: e.target.valueAsNumber || 0
              }));
            }}
          />
        </Flex>
        <Text
          variant={"body"}
          sx={{ mt: 1, display: ["none", "block", "block"] }}
        >
          {cellLocation.column} x {cellLocation.row}
        </Text>
      </Flex>
    </Popup>
  );
}

function getCellLocation(index: number, tableSize: TableSize): CellLocation {
  const cellIndex = index + 1;
  const column = cellIndex % tableSize.columns;
  let row = cellIndex / tableSize.columns;
  const flooredRow = Math.floor(row);
  row = row === flooredRow ? row : flooredRow + 1;

  return { column: column ? column : tableSize.columns, row };
}

function isCellHighlighted(
  index: number,
  currentCellLocation: CellLocation,
  tableSize: TableSize
) {
  const cellLocation = getCellLocation(index, tableSize);
  return (
    cellLocation.row <= currentCellLocation.row &&
    cellLocation.column <= currentCellLocation.column
  );
}
