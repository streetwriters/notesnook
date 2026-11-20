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

import { Box, Flex, Text } from "@ui";
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

  const insert = () =>
    onInsertTable({ columns: cellLocation.column, rows: cellLocation.row });

  return (
    <Popup
      action={{
        title:
          !cellLocation.column || !cellLocation.row
            ? strings.setTableSizeNotice()
            : strings.insertTableOfSize(cellLocation.row, cellLocation.column),
        disabled: !cellLocation.column || !cellLocation.row,
        onClick: insert
      }}
    >
      <Flex
        sx={{ px: 1, pt: 1, flexDirection: "column", alignItems: "center" }}
      >
        <Flex
          testID="table-size-grid"
          sx={{
            flexDirection: "column",
            bg: "background",
            width: "100%",
            gap: "small"
          }}
        >
          {Array.from({ length: tableSize.rows }, (_, row) => (
            <Flex key={row} sx={{ flexDirection: "row", gap: "small" }}>
              {Array.from({ length: tableSize.columns }, (_, column) => {
                const location = { row: row + 1, column: column + 1 };
                const highlighted =
                  location.row <= cellLocation.row &&
                  location.column <= cellLocation.column;
                return (
                  <Box
                    key={column}
                    sx={{
                      flex: 1,
                      minWidth: cellSize,
                      height: cellSize,
                      borderRadius: "small",
                      border: "1px solid",
                      ...(highlighted
                        ? {
                            bg: "background-selected",
                            borderColor: "transparent"
                          }
                        : {
                            bg: "background-secondary",
                            borderColor: "border"
                          })
                    }}
                    onHoverIn={() => setCellLocation(location)}
                    onPress={() => {
                      setCellLocation(location);
                      onInsertTable({
                        columns: location.column,
                        rows: location.row
                      });
                    }}
                  />
                );
              })}
            </Flex>
          ))}
        </Flex>
        {isMobile ? (
          <Flex
            sx={{
              mt: 1,
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "100%"
            }}
          >
            <InlineInput
              containerProps={{ sx: { mr: 1, flexShrink: 1 } }}
              label={strings.columns()}
              placeholder={strings.totalColumns(cellLocation.column)}
              type="number"
              value={String(cellLocation.column)}
              onChangeText={(text) =>
                setCellLocation((l) => ({ ...l, column: Number(text) || 0 }))
              }
            />
            <InlineInput
              containerProps={{ sx: { flexShrink: 1 } }}
              label={strings.rows()}
              placeholder={strings.totalRows(cellLocation.row)}
              type="number"
              value={String(cellLocation.row)}
              onChangeText={(text) =>
                setCellLocation((l) => ({ ...l, row: Number(text) || 0 }))
              }
            />
          </Flex>
        ) : (
          <Text variant={"body"} sx={{ mt: 1 }}>
            {cellLocation.column} x {cellLocation.row}
          </Text>
        )}
      </Flex>
    </Popup>
  );
}
