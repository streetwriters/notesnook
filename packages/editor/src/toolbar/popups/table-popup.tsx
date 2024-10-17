/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Box, Flex, Text } from "@theme-ui/components";
import { useEffect, useState } from "react";
import { Popup } from "../components/popup.js";
import { useIsMobile } from "../stores/toolbar-store.js";
import { InlineInput } from "../../components/inline-input/index.js";
import { strings } from "@notesnook/intl";

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
            ? strings.setTableSizeNotice()
            : strings.insertTableOfSize(cellLocation.row, cellLocation.column),
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
                sx={{
                  height: cellSize || 15,
                  borderRadius: "small",
                  border: "1px solid",
                  ...(isCellHighlighted(index, cellLocation, tableSize)
                    ? {
                        bg: "background-selected",
                        borderColor: "transparent"
                      }
                    : { bg: "transparent", borderColor: "border" })
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
            justifyContent: "center",
            maxWidth: "100%"
          }}
        >
          <InlineInput
            containerProps={{ sx: { mr: 1, flexShrink: 1 } }}
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
            containerProps={{ sx: { flexShrink: 1 } }}
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
