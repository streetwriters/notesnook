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

import { forwardRef, useCallback, type ReactNode } from "react";
import { Box, VirtualList, type SxProp, type VirtualListHandle } from "@ui";

export type VirtualizedListProps<T, C> = {
  items: T[];
  estimatedSize: number;
  getItemKey: (index: number, items: T[]) => string;
  context?: C;
  renderItem: (props: { item: T; index: number; context: C }) => ReactNode;
  itemGap?: number;
  mode?: "fixed" | "dynamic";
  overscan?: number;
  header?: ReactNode;
  testID?: string;
  sx?: SxProp;
};

function VirtualizedListInner<T, C>(
  props: VirtualizedListProps<T, C>,
  ref: React.ForwardedRef<VirtualListHandle>
) {
  const {
    items,
    getItemKey,
    renderItem: Item,
    estimatedSize,
    context,
    itemGap = 0,
    overscan = 400,
    header,
    sx,
    testID
  } = props;

  const renderItem = useCallback(
    (index: number) => (
      <Box sx={{ pb: itemGap }}>
        <Item
          item={items[index]}
          index={index}
          context={context || ({} as C)}
        />
      </Box>
    ),
    [items, context, itemGap]
  );
  const itemKey = useCallback(
    (index: number) => getItemKey(index, items),
    [getItemKey, items]
  );

  return (
    <VirtualList
      ref={ref}
      testID={testID || "virtualized-list"}
      count={items.length}
      itemKey={itemKey}
      renderItem={renderItem}
      estimatedItemSize={estimatedSize + itemGap}
      extraData={context}
      header={header}
      overscan={overscan}
      sx={sx}
    />
  );
}

export const VirtualizedList = forwardRef(VirtualizedListInner) as <T, C>(
  props: VirtualizedListProps<T, C> & {
    ref?: React.Ref<VirtualListHandle>;
  }
) => JSX.Element;
