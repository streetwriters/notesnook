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

import { useCallback, type ReactNode } from "react";
import { VirtualList, type SxProp } from "@ui";

export type VirtualizedTableRowProps<T, C> = {
  item: T;
  index: number;
  context?: C;
};

type VirtualizedTableProps<T, C> = {
  items: T[];
  estimatedSize: number;
  getItemKey: (index: number) => string;
  context?: C;
  renderRow: (props: VirtualizedTableRowProps<T, C>) => ReactNode;
  header: ReactNode;
  testID?: string;
  sx?: SxProp;
};

export function VirtualizedTable<T, C>(props: VirtualizedTableProps<T, C>) {
  const {
    items,
    getItemKey,
    renderRow: Row,
    estimatedSize,
    header,
    context,
    testID,
    sx
  } = props;

  const renderItem = useCallback(
    (index: number) => (
      <Row item={items[index]} index={index} context={context} />
    ),
    [items, context]
  );

  return (
    <VirtualList
      testID={testID || "virtualized-table"}
      count={items.length}
      itemKey={getItemKey}
      renderItem={renderItem}
      estimatedItemSize={estimatedSize}
      extraData={context}
      header={header}
      overscan={300}
      sx={sx}
    />
  );
}
