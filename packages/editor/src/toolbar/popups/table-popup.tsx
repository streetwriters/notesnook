import { Box, Flex, Text } from "rebass";
import { useEffect, useState } from "react";
import { Popup } from "../components/popup";

const MAX_COLUMNS = 20;
const MAX_ROWS = 20;
const MIN_COLUMNS = 12;
const MIN_ROWS = 6;

type CellLocation = { column: number; row: number };
type TableSize = { columns: number; rows: number };

export type TablePopupProps = {
  onClose: (size: TableSize) => void;
};
export function TablePopup(props: TablePopupProps) {
  const { onClose } = props;
  const [cellLocation, setCellLocation] = useState<CellLocation>({
    column: 0,
    row: 0,
  });
  const [tableSize, setTableSize] = useState<TableSize>({
    columns: MIN_COLUMNS,
    rows: MIN_ROWS,
  });

  useEffect(() => {
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
  }, [cellLocation]);

  return (
    <Flex sx={{ p: 1, flexDirection: "column", alignItems: "center" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr ".repeat(tableSize.columns),
          gap: "3px",
          bg: "background",
        }}
      >
        {Array(tableSize.columns * tableSize.rows)
          .fill(0)
          .map((_, index) => (
            <Box
              width={15}
              height={15}
              sx={{
                border: "1px solid var(--disabled)",
                borderRadius: "2px",
                bg: isCellHighlighted(index, cellLocation, tableSize)
                  ? "disabled"
                  : "transparent",
                ":hover": {
                  bg: "disabled",
                },
              }}
              onMouseEnter={() => {
                setCellLocation(getCellLocation(index, tableSize));
              }}
              onClick={() => {
                onClose({
                  columns: cellLocation.column,
                  rows: cellLocation.row,
                });
              }}
            />
          ))}
      </Box>
      <Text variant={"body"} sx={{ mt: 1 }}>
        {cellLocation.column}x{cellLocation.row}
      </Text>
    </Flex>
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
