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

import { forwardRef, useCallback, useMemo, type ReactNode } from "react";
import {
  Flex,
  Virtuoso,
  type SxProp,
  type VirtuosoHandle
} from "@notesnook/ui-kit";
import { ListHeader } from "../virtualized-list";

type VirtualizedGridProps<T> = {
  items: T[];
  estimatedSize: number;
  getItemKey: (index: number) => string;
  renderItem: (props: { item: T; index: number }) => ReactNode;
  columns: number;
  onEndReached?: () => void;
  header?: ReactNode;
  "data-test-id"?: string;
  sx?: SxProp;
};

const WITH_HEADER = { Header: ListHeader };
const NO_COMPONENTS = {};

function VirtualizedGridInner<T>(
  props: VirtualizedGridProps<T>,
  ref: React.ForwardedRef<VirtuosoHandle>
) {
  const {
    items,
    getItemKey,
    renderItem: Item,
    estimatedSize,
    columns,
    onEndReached,
    header,
    sx
  } = props;
  const rowCount = Math.ceil(items.length / columns);

  const renderRow = useCallback(
    (row: number) => {
      if (row === rowCount - 1) onEndReached?.();
      const cells: ReactNode[] = [];
      for (let column = 0; column < columns; column++) {
        const index = row * columns + column;
        cells.push(
          <Flex
            key={index < items.length ? getItemKey(index) : `empty-${column}`}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {index < items.length ? (
              <Item item={items[index]} index={index} />
            ) : null}
          </Flex>
        );
      }
      return <Flex sx={{ flexDirection: "row" }}>{cells}</Flex>;
    },
    [items, columns, getItemKey, rowCount, onEndReached, Item]
  );
  const rowKey = useCallback(
    (row: number) => {
      const first = row * columns;
      return `row-${getItemKey(first)}`;
    },
    [columns, getItemKey]
  );
  const listContext = useMemo(() => ({ header }), [header]);

  return (
    <Flex
      data-test-id={props["data-test-id"] || "virtualized-grid"}
      sx={{ flex: 1, flexDirection: "column", overflow: "hidden", ...sx }}
    >
      <Virtuoso
        ref={ref}
        style={{ flex: 1 }}
        totalCount={rowCount}
        computeItemKey={rowKey}
        itemContent={renderRow}
        context={listContext}
        components={header ? WITH_HEADER : NO_COMPONENTS}
        defaultItemHeight={estimatedSize}
      />
    </Flex>
  );
}

export const VirtualizedGrid = forwardRef(VirtualizedGridInner) as <T>(
  props: VirtualizedGridProps<T> & { ref?: React.Ref<VirtuosoHandle> }
) => JSX.Element;
